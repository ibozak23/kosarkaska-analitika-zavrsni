import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { GameStatus, Position } from "@ibozak23/kosarkaska-analitika";
import type { Game, Player, Team } from "@ibozak23/kosarkaska-analitika";

import { pripremiServise } from "../src/sastavljanje-servisa.js";
import { U_MEMORIJI, otvoriBazu } from "../src/baza/veza-s-bazom.js";
import { DEMONSTRACIJSKE_LIGASKE_KONSTANTE } from "../src/konfiguracija/ligaske-konstante.js";
import { pripremiAplikaciju } from "../src/upravljaci/sastavljanje-aplikacije.js";
import type {
  OblikovaniSazetakUtakmice,
  OblikovaniPokazateljiIgraca,
  OblikovaniPokazateljiTima
} from "../src/upravljaci/oblikovanje-odgovora.js";
import {
  DOMACI_DRESOVI,
  GOSTUJUCI_DRESOVI,
  KONTROLNI_DOGADJAJI
} from "./kontrolna-utakmica.js";
import type { KontrolniDogadjaj } from "./kontrolna-utakmica.js";

const POZICIJE = [Position.PG, Position.SG, Position.SF, Position.PF, Position.C];

interface OdigranaUtakmica {
  readonly aplikacija: Express;
  readonly utakmica: Game;
  readonly domaci: Team;
  readonly gosti: Team;
  readonly igraciPoDresu: ReadonlyMap<number, Player>;
}

function noviPosluzitelj(): Express {
  return pripremiAplikaciju(pripremiServise(otvoriBazu(U_MEMORIJI), DEMONSTRACIJSKE_LIGASKE_KONSTANTE));
}

function tijeloDogadjaja(kontrolni: KontrolniDogadjaj, igrac: Player): Record<string, unknown> {
  const tijelo: Record<string, unknown> = {
    type: kontrolni.type,
    playerId: igrac.id,
    teamId: igrac.teamId,
    quarter: kontrolni.quarter,
    minute: kontrolni.minute,
    second: kontrolni.second
  };

  if (kontrolni.points !== null) {
    tijelo["points"] = kontrolni.points;
  }

  if (kontrolni.made !== null) {
    tijelo["made"] = kontrolni.made;
  }

  if (kontrolni.direction !== null) {
    tijelo["direction"] = kontrolni.direction;
  }

  return tijelo;
}

async function upisiTim(aplikacija: Express, name: string): Promise<Team> {
  const odgovor = await request(aplikacija)
    .post("/api/teams")
    .send({ name, city: null, league: "A1", season: "2025/2026" })
    .expect(201);

  const tim: Team = odgovor.body;

  return tim;
}

async function upisiIgrace(aplikacija: Express, tim: Team, dresovi: readonly number[]): Promise<Player[]> {
  const igraci: Player[] = [];

  for (let redni = 0; redni < dresovi.length; redni += 1) {
    const dres = dresovi[redni] ?? 0;
    const odgovor = await request(aplikacija)
      .post("/api/players")
      .send({
        firstName: `Igrac${dres}`,
        lastName: `Prezime${dres}`,
        position: POZICIJE[redni] ?? Position.PG,
        heightCm: 190,
        jerseyNumber: dres,
        teamId: tim.id
      })
      .expect(201);

    const igrac: Player = odgovor.body;

    igraci.push(igrac);
  }

  return igraci;
}

async function odigrajKontrolnuUtakmicu(): Promise<OdigranaUtakmica> {
  const aplikacija = noviPosluzitelj();

  const domaci = await upisiTim(aplikacija, "Domaci");
  const gosti = await upisiTim(aplikacija, "Gosti");
  const domaciIgraci = await upisiIgrace(aplikacija, domaci, DOMACI_DRESOVI);
  const gostujuciIgraci = await upisiIgrace(aplikacija, gosti, GOSTUJUCI_DRESOVI);

  const igraciPoDresu = new Map<number, Player>();

  for (const igrac of [...domaciIgraci, ...gostujuciIgraci]) {
    igraciPoDresu.set(igrac.jerseyNumber ?? 0, igrac);
  }

  const registracija = await request(aplikacija)
    .post("/api/games")
    .send({
      playedAt: "2026-03-14T19:00:00.000Z",
      homeTeamId: domaci.id,
      awayTeamId: gosti.id,
      homeStarters: domaciIgraci.map((igrac) => igrac.id),
      awayStarters: gostujuciIgraci.map((igrac) => igrac.id)
    })
    .expect(201);

  const utakmica: Game = registracija.body;

  for (const kontrolni of KONTROLNI_DOGADJAJI) {
    const igrac = igraciPoDresu.get(kontrolni.dres);

    if (igrac === undefined) {
      throw new Error(`Kontrolna utakmica traži dres ${kontrolni.dres}, kojeg nema.`);
    }

    await request(aplikacija)
      .post(`/api/games/${utakmica.id}/events`)
      .send(tijeloDogadjaja(kontrolni, igrac))
      .expect(201);
  }

  await request(aplikacija).post(`/api/games/${utakmica.id}/finish`).expect(200);

  return { aplikacija, utakmica, domaci, gosti, igraciPoDresu };
}

describe("cijeli tijek kroz REST sučelje nad kontrolnom utakmicom", () => {
  let odigrana: OdigranaUtakmica;

  beforeAll(async () => {
    odigrana = await odigrajKontrolnuUtakmicu();
  });

  function igrac(dres: number): Player {
    const pronadjen = odigrana.igraciPoDresu.get(dres);

    if (pronadjen === undefined) {
      throw new Error(`Nema igrača s dresom ${dres}.`);
    }

    return pronadjen;
  }

  it("upisuje sve događaje zapisnika, uključujući početne petorke", async () => {
    const odgovor = await request(odigrana.aplikacija)
      .get(`/api/games/${odigrana.utakmica.id}/events`)
      .expect(200);

    const dogadjaji: readonly unknown[] = odgovor.body;

    expect(dogadjaji).toHaveLength(KONTROLNI_DOGADJAJI.length + 10);
    expect(odigrana.utakmica.status).toBe(GameStatus.IN_PROGRESS);
  });

  it("vraća sažetak igrača 7 jednak ručnom izračunu iz docs/formule.md", async () => {
    const odgovor = await request(odigrana.aplikacija)
      .get(`/api/games/${odigrana.utakmica.id}/players/${igrac(7).id}/stats`)
      .expect(200);

    const statistika: OblikovaniPokazateljiIgraca = odgovor.body;
    const sazetak = statistika.boxScore;

    if (sazetak === null) {
      throw new Error("sažetak igrača nije izračunat");
    }

    expect(sazetak.playedSeconds).toBe(1740);
    expect(sazetak.points).toBe(9);
    expect(sazetak.fieldGoalsAttempted).toBe(6);
    expect(sazetak.fieldGoalsMade).toBe(3);
    expect(sazetak.threePointersMade).toBe(1);
    expect(sazetak.freeThrowsAttempted).toBe(3);
    expect(sazetak.freeThrowsMade).toBe(2);
    expect(sazetak.offensiveRebounds).toBe(1);
    expect(sazetak.defensiveRebounds).toBe(3);
    expect(sazetak.totalRebounds).toBe(4);
    expect(sazetak.assists).toBe(2);
    expect(sazetak.turnovers).toBe(2);
    expect(sazetak.steals).toBe(1);
    expect(sazetak.blocks).toBe(1);
    expect(sazetak.personalFouls).toBe(2);
  });

  it("vraća PER, postotak istinske preciznosti i pozitivno/negativno kao jedinični test okvira", async () => {
    const odgovor = await request(odigrana.aplikacija)
      .get(`/api/games/${odigrana.utakmica.id}/players/${igrac(7).id}/stats`)
      .expect(200);

    const statistika: OblikovaniPokazateljiIgraca = odgovor.body;

    expect(statistika.playerEfficiencyRating).toBe(0.235);
    expect(statistika.trueShootingPercentage).toBe(0.615);
    expect(statistika.plusMinus).toBe(3);
    expect(statistika.custom).toEqual({});
  });

  it("vraća timske pokazatelje obaju timova kao jedinični test okvira", async () => {
    const domaciOdgovor = await request(odigrana.aplikacija)
      .get(`/api/games/${odigrana.utakmica.id}/teams/${odigrana.domaci.id}/stats`)
      .expect(200);
    const gostiOdgovor = await request(odigrana.aplikacija)
      .get(`/api/games/${odigrana.utakmica.id}/teams/${odigrana.gosti.id}/stats`)
      .expect(200);

    const domaci: OblikovaniPokazateljiTima = domaciOdgovor.body;
    const gosti: OblikovaniPokazateljiTima = gostiOdgovor.body;

    expect(domaci.pace).toBe(11.6);
    expect(gosti.pace).toBe(11.6);
    expect(domaci.offensiveRating).toBe(114.841);
    expect(domaci.defensiveRating).toBe(84.175);
    expect(gosti.offensiveRating).toBe(84.175);
    expect(gosti.defensiveRating).toBe(114.841);
  });

  it("sažetak utakmice daje oba tima s po pet igrača i točnim zbrojem poena", async () => {
    const odgovor = await request(odigrana.aplikacija)
      .get(`/api/games/${odigrana.utakmica.id}/box-score`)
      .expect(200);

    const sazetak: OblikovaniSazetakUtakmice = odgovor.body;

    expect(sazetak.game.status).toBe(GameStatus.FINISHED);
    expect(sazetak.home.players).toHaveLength(5);
    expect(sazetak.away.players).toHaveLength(5);
    expect(zbrojPoena(sazetak.home.players)).toBe(13);
    expect(zbrojPoena(sazetak.away.players)).toBe(10);
  });
});

describe("odgovori REST sučelja na neispravan zahtjev", () => {
  it("vraća 404 za utakmicu koja ne postoji", async () => {
    const odgovor = await request(noviPosluzitelj()).get("/api/games/999/box-score").expect(404);
    const tijelo: { poruka: string } = odgovor.body;

    expect(tijelo.poruka).toContain("999");
  });

  it("vraća 400 za tijelo zahtjeva bez obaveznog polja", async () => {
    const odgovor = await request(noviPosluzitelj())
      .post("/api/teams")
      .send({ city: "Zagreb" })
      .expect(400);
    const tijelo: { poruka: string } = odgovor.body;

    expect(tijelo.poruka).toContain("name");
  });

  it("vraća 404 za nepoznatu rutu", async () => {
    await request(noviPosluzitelj()).get("/api/nepostojece").expect(404);
  });
});

function zbrojPoena(redci: OblikovaniSazetakUtakmice["home"]["players"]): number {
  let zbroj = 0;

  for (const redak of redci) {
    zbroj += redak.stats.boxScore?.points ?? 0;
  }

  return zbroj;
}
