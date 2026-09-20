import type { Express } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { EventType, GameStatus, Position, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";

import { pripremiServise } from "../src/sastavljanje-servisa.js";
import { U_MEMORIJI, otvoriBazu } from "../src/baza/veza-s-bazom.js";
import { DEMONSTRACIJSKE_LIGASKE_KONSTANTE } from "../src/konfiguracija/ligaske-konstante.js";
import { pripremiAplikaciju } from "../src/upravljaci/sastavljanje-aplikacije.js";

const POZICIJE = [Position.PG, Position.SG, Position.SF, Position.PF, Position.C, Position.PG];

const DOMACI_DRESOVI = [4, 5, 6, 7, 8, 9];
const GOSTUJUCI_DRESOVI = [11, 12, 13, 14, 15, 16];

const POCETNIH_IZMJENA = 10;

function noviPosluzitelj(): Express {
  return pripremiAplikaciju(pripremiServise(otvoriBazu(U_MEMORIJI), DEMONSTRACIJSKE_LIGASKE_KONSTANTE));
}

function igraci(dresovi: readonly number[], prezime: string): Record<string, unknown>[] {
  return dresovi.map((dres, redni) => ({
    jerseyNumber: dres,
    firstName: `Igrac${String(dres)}`,
    lastName: prezime,
    position: POZICIJE[redni % POZICIJE.length],
    heightCm: 190
  }));
}

function strana(name: string, dresovi: readonly number[], prezime: string): Record<string, unknown> {
  return {
    team: { name, city: null, league: "Probna liga", season: "2025/2026" },
    players: igraci(dresovi, prezime),
    starters: dresovi.slice(0, 5)
  };
}

function dogadjaj(
  side: string,
  jerseyNumber: number,
  quarter: number,
  minute: number,
  second: number,
  type: EventType
): Record<string, unknown> {
  return { side, jerseyNumber, quarter, minute, second, type };
}

const DOGADJAJI: Record<string, unknown>[] = [
  { ...dogadjaj("HOME", 7, 1, 9, 51, EventType.SHOT), points: 3, made: true },
  dogadjaj("HOME", 4, 1, 9, 51, EventType.ASSIST),
  dogadjaj("AWAY", 11, 1, 9, 0, EventType.REBOUND_DEF),
  { ...dogadjaj("HOME", 4, 2, 5, 36, EventType.SUBSTITUTION), direction: SubstitutionDirection.OUT },
  { ...dogadjaj("HOME", 9, 2, 5, 36, EventType.SUBSTITUTION), direction: SubstitutionDirection.IN },
  dogadjaj("AWAY", 12, 3, 4, 10, EventType.STEAL),
  { ...dogadjaj("AWAY", 11, 4, 0, 30, EventType.SHOT), points: 2, made: false }
];

function zahtjevUvoza(dogadjaji: readonly Record<string, unknown>[] = DOGADJAJI): Record<string, unknown> {
  return {
    playedAt: "2026-03-14T19:00:00.000Z",
    home: strana("Sokolovi Probni", DOMACI_DRESOVI, "Domaci"),
    away: strana("Drava Probna", GOSTUJUCI_DRESOVI, "Gostujuci"),
    events: dogadjaji
  };
}

async function ocekujOdbijanje(aplikacija: Express, tijelo: Record<string, unknown>): Promise<string> {
  const odgovor = await request(aplikacija).post("/api/games/import").send(tijelo).expect(400);

  await request(aplikacija).get("/api/games").expect(200).expect([]);
  await request(aplikacija).get("/api/teams").expect(200).expect([]);
  await request(aplikacija).get("/api/players").expect(200).expect([]);

  return String(odgovor.body.poruka);
}

describe("uvoz utakmice", () => {
  it("upisuje cijelu utakmicu jednim zahtjevom", async () => {
    const aplikacija = noviPosluzitelj();

    const odgovor = await request(aplikacija).post("/api/games/import").send(zahtjevUvoza()).expect(201);

    expect(odgovor.body.eventCount).toBe(DOGADJAJI.length);
    expect(odgovor.body.createdTeams).toBe(2);
    expect(odgovor.body.createdPlayers).toBe(DOMACI_DRESOVI.length + GOSTUJUCI_DRESOVI.length);
    expect(odgovor.body.game.status).toBe(GameStatus.FINISHED);

    const dogadjaji = await request(aplikacija)
      .get(`/api/games/${String(odgovor.body.game.id)}/events`)
      .expect(200);

    expect(dogadjaji.body).toHaveLength(DOGADJAJI.length + POCETNIH_IZMJENA);
  });

  it("pri ponovnom uvozu ne udvostručuje timove ni igrače", async () => {
    const aplikacija = noviPosluzitelj();

    await request(aplikacija).post("/api/games/import").send(zahtjevUvoza()).expect(201);
    const drugi = await request(aplikacija).post("/api/games/import").send(zahtjevUvoza()).expect(201);

    expect(drugi.body.createdTeams).toBe(0);
    expect(drugi.body.createdPlayers).toBe(0);

    await request(aplikacija).get("/api/teams").expect(200).expect((odgovor) => {
      expect(odgovor.body).toHaveLength(2);
    });

    await request(aplikacija).get("/api/games").expect(200).expect((odgovor) => {
      expect(odgovor.body).toHaveLength(2);
    });
  });

  it("prihvaća događaje zapisane izvan kronološkog reda", async () => {
    const aplikacija = noviPosluzitelj();

    const odgovor = await request(aplikacija)
      .post("/api/games/import")
      .send(zahtjevUvoza([...DOGADJAJI].reverse()))
      .expect(201);

    const dogadjaji = await request(aplikacija)
      .get(`/api/games/${String(odgovor.body.game.id)}/events`)
      .expect(200);

    expect(dogadjaji.body).toHaveLength(DOGADJAJI.length + POCETNIH_IZMJENA);
  });

  it("poništava cijeli uvoz kad niz izmjena nije smislen", async () => {
    const poruka = await ocekujOdbijanje(
      noviPosluzitelj(),
      zahtjevUvoza([
        { ...dogadjaj("HOME", 9, 2, 5, 36, EventType.SUBSTITUTION), direction: SubstitutionDirection.IN }
      ])
    );

    expect(poruka).toContain("SUBSTITUTION");
    expect(poruka).toContain("više od 5 igrača");
  });

  it("poništava cijeli uvoz kad je vrijeme izvan trajanja četvrtine", async () => {
    const poruka = await ocekujOdbijanje(
      noviPosluzitelj(),
      zahtjevUvoza([dogadjaj("HOME", 7, 1, 11, 0, EventType.STEAL)])
    );

    expect(poruka).toContain("izvan je trajanja te četvrtine");
  });

  it("odbija događaj igrača kojega nema u sastavu", async () => {
    const poruka = await ocekujOdbijanje(
      noviPosluzitelj(),
      zahtjevUvoza([dogadjaj("HOME", 77, 1, 5, 0, EventType.STEAL)])
    );

    expect(poruka).toContain("nije u sastavu svojega tima");
  });

  it("odbija tijelo bez popisa događaja", async () => {
    const aplikacija = noviPosluzitelj();
    const tijelo = zahtjevUvoza();

    delete tijelo["events"];

    const odgovor = await request(aplikacija).post("/api/games/import").send(tijelo).expect(400);

    expect(String(odgovor.body.poruka)).toContain("events");
  });
});
