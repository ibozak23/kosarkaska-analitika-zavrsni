import { describe, expect, it } from "vitest";
import { EventType, GameStatus, Position, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";
import type { Game, Player, Team } from "@ibozak23/kosarkaska-analitika";

import { pripremiServise } from "../src/sastavljanje-servisa.js";
import type { Servisi } from "../src/sastavljanje-servisa.js";
import { U_MEMORIJI, otvoriBazu } from "../src/baza/veza-s-bazom.js";
import { DEMONSTRACIJSKE_LIGASKE_KONSTANTE } from "../src/konfiguracija/ligaske-konstante.js";
import { PogreskaNepostojecegZapisa, PogreskaProvjere } from "../src/pogreske/pogreske.js";

const POZICIJE = [Position.PG, Position.SG, Position.SF, Position.PF, Position.C];

interface Postava {
  readonly servisi: Servisi;
  readonly domaci: Team;
  readonly gosti: Team;
  readonly domaciIgraci: readonly Player[];
  readonly gostiIgraci: readonly Player[];
}

function upisiPetorku(servisi: Servisi, tim: Team, prviBroj: number): Player[] {
  const igraci: Player[] = [];

  for (let redni = 0; redni < POZICIJE.length; redni += 1) {
    igraci.push(
      servisi.maticniPodaci.spremiIgraca({
        firstName: `Ime${prviBroj + redni}`,
        lastName: `Prezime${prviBroj + redni}`,
        position: POZICIJE[redni] ?? Position.PG,
        heightCm: 190,
        jerseyNumber: prviBroj + redni,
        teamId: tim.id
      })
    );
  }

  return igraci;
}

function pripremi(): Postava {
  const baza = otvoriBazu(U_MEMORIJI);
  const servisi = pripremiServise(baza, DEMONSTRACIJSKE_LIGASKE_KONSTANTE);

  const domaci = servisi.maticniPodaci.spremiTim({
    name: "Sokolovi",
    city: "Zagreb",
    league: "A1",
    season: "2025/2026"
  });
  const gosti = servisi.maticniPodaci.spremiTim({
    name: "Jastrebovi",
    city: "Split",
    league: "A1",
    season: "2025/2026"
  });

  return {
    servisi,
    domaci,
    gosti,
    domaciIgraci: upisiPetorku(servisi, domaci, 1),
    gostiIgraci: upisiPetorku(servisi, gosti, 11)
  };
}

function registriraj(postava: Postava): Game {
  return postava.servisi.utakmice.spremiPrijavuUtakmice({
    playedAt: new Date("2026-03-14T19:00:00.000Z"),
    homeTeamId: postava.domaci.id,
    awayTeamId: postava.gosti.id,
    homeStarters: postava.domaciIgraci.map((igrac) => igrac.id),
    awayStarters: postava.gostiIgraci.map((igrac) => igrac.id)
  });
}

describe("servis matičnih podataka", () => {
  it("čisti rubne razmake i pamti tim", () => {
    const { servisi } = pripremi();

    const tim = servisi.maticniPodaci.spremiTim({
      name: "  Medvjedi  ",
      city: "   ",
      league: null,
      season: "2025/2026"
    });

    expect(tim.name).toBe("Medvjedi");
    expect(tim.city).toBeNull();
    expect(servisi.maticniPodaci.dohvatiTim(tim.id)).toEqual(tim);
  });

  it("odbija prazan naziv tima", () => {
    const { servisi } = pripremi();

    expect(() => servisi.maticniPodaci.spremiTim({ name: "   ", city: null, league: null, season: null }))
      .toThrow(PogreskaProvjere);
  });

  it("javlja da traženi tim ne postoji", () => {
    const { servisi } = pripremi();

    expect(() => servisi.maticniPodaci.dohvatiTim(404)).toThrow(PogreskaNepostojecegZapisa);
  });

  it("odbija visinu izvan dopuštenog raspona", () => {
    const { servisi, domaci } = pripremi();

    expect(() =>
      servisi.maticniPodaci.spremiIgraca({
        firstName: "Ivan",
        lastName: "Horvat",
        position: Position.C,
        heightCm: 320,
        jerseyNumber: 4,
        teamId: domaci.id
      })
    ).toThrow(PogreskaProvjere);
  });

  it("odbija brisanje tima koji ima igrače", () => {
    const { servisi, domaci } = pripremi();

    expect(() => servisi.maticniPodaci.obrisiTim(domaci.id)).toThrow(PogreskaProvjere);
  });

  it("odbija brisanje igrača koji ima zapisane događaje", () => {
    const postava = pripremi();
    registriraj(postava);

    const igrac = postava.domaciIgraci[0];

    if (igrac === undefined) {
      throw new Error("postava nema igrača");
    }

    expect(() => postava.servisi.maticniPodaci.obrisiIgraca(igrac.id)).toThrow(PogreskaProvjere);
  });
});

describe("servis utakmica", () => {
  it("registracijom nastaje utakmica u tijeku i deset ulazaka početnih petorki", () => {
    const postava = pripremi();

    const utakmica = registriraj(postava);
    const dogadjaji = postava.servisi.utakmice.dohvatiDogadjaje(utakmica.id);

    expect(utakmica.status).toBe(GameStatus.IN_PROGRESS);
    expect(dogadjaji).toHaveLength(10);

    for (const dogadjaj of dogadjaji) {
      expect(dogadjaj.type).toBe(EventType.SUBSTITUTION);
      expect(dogadjaj.quarter).toBe(1);
      expect(dogadjaj.minute).toBe(10);
      expect(dogadjaj.second).toBe(0);
    }
  });

  it("odbija utakmicu u kojoj je isti tim domaći i gost", () => {
    const postava = pripremi();

    expect(() =>
      postava.servisi.utakmice.spremiPrijavuUtakmice({
        playedAt: new Date("2026-03-14T19:00:00.000Z"),
        homeTeamId: postava.domaci.id,
        awayTeamId: postava.domaci.id,
        homeStarters: postava.domaciIgraci.map((igrac) => igrac.id),
        awayStarters: postava.domaciIgraci.map((igrac) => igrac.id)
      })
    ).toThrow(PogreskaProvjere);
  });

  it("odbija početnu petorku koja nema pet igrača", () => {
    const postava = pripremi();

    expect(() =>
      postava.servisi.utakmice.spremiPrijavuUtakmice({
        playedAt: new Date("2026-03-14T19:00:00.000Z"),
        homeTeamId: postava.domaci.id,
        awayTeamId: postava.gosti.id,
        homeStarters: postava.domaciIgraci.slice(0, 4).map((igrac) => igrac.id),
        awayStarters: postava.gostiIgraci.map((igrac) => igrac.id)
      })
    ).toThrow(PogreskaProvjere);
  });

  it("odbija početnu petorku s igračem drugog tima", () => {
    const postava = pripremi();

    expect(() =>
      postava.servisi.utakmice.spremiPrijavuUtakmice({
        playedAt: new Date("2026-03-14T19:00:00.000Z"),
        homeTeamId: postava.domaci.id,
        awayTeamId: postava.gosti.id,
        homeStarters: postava.gostiIgraci.map((igrac) => igrac.id),
        awayStarters: postava.gostiIgraci.map((igrac) => igrac.id)
      })
    ).toThrow(PogreskaProvjere);
  });

  it("upisuje šut i vraća ga u kronološkom popisu", () => {
    const postava = pripremi();
    const utakmica = registriraj(postava);
    const strijelac = prviIgrac(postava.domaciIgraci);

    const sut = postava.servisi.utakmice.spremiDogadjaj(utakmica.id, {
      type: EventType.SHOT,
      gameId: utakmica.id,
      playerId: strijelac.id,
      teamId: strijelac.teamId,
      quarter: 1,
      minute: 7,
      second: 46,
      points: 2,
      made: true
    });

    expect(sut.id).toBeGreaterThan(0);
    expect(postava.servisi.utakmice.dohvatiDogadjaje(utakmica.id)).toHaveLength(11);
  });

  it("odbija vrijeme izvan trajanja četvrtine", () => {
    const postava = pripremi();
    const utakmica = registriraj(postava);
    const strijelac = prviIgrac(postava.domaciIgraci);

    expect(() =>
      postava.servisi.utakmice.spremiDogadjaj(utakmica.id, {
        type: EventType.SHOT,
        gameId: utakmica.id,
        playerId: strijelac.id,
        teamId: strijelac.teamId,
        quarter: 1,
        minute: 10,
        second: 30,
        points: 2,
        made: true
      })
    ).toThrow(PogreskaProvjere);
  });

  it("odbija događaje nakon završetka utakmice", () => {
    const postava = pripremi();
    const utakmica = registriraj(postava);
    const strijelac = prviIgrac(postava.domaciIgraci);

    postava.servisi.utakmice.izmijeniUtakmicuUZavrsenu(utakmica.id);

    expect(() =>
      postava.servisi.utakmice.spremiDogadjaj(utakmica.id, {
        type: EventType.ASSIST,
        gameId: utakmica.id,
        playerId: strijelac.id,
        teamId: strijelac.teamId,
        quarter: 1,
        minute: 5,
        second: 0
      })
    ).toThrow(PogreskaProvjere);
  });
});

describe("provjera niza izmjena pri unosu", () => {
  it("prihvaća izlazak igrača koji je na terenu", () => {
    const postava = pripremi();
    const utakmica = registriraj(postava);
    const igrac = prviIgrac(postava.domaciIgraci);

    const izlazak = postava.servisi.utakmice.spremiDogadjaj(utakmica.id, izmjena(utakmica.id, igrac, 5, 0, SubstitutionDirection.OUT));

    expect(izlazak.type).toBe(EventType.SUBSTITUTION);
  });

  it("odbija izlazak igrača koji nije na terenu", () => {
    const postava = pripremi();
    const utakmica = registriraj(postava);
    const igrac = prviIgrac(postava.domaciIgraci);

    postava.servisi.utakmice.spremiDogadjaj(utakmica.id, izmjena(utakmica.id, igrac, 5, 0, SubstitutionDirection.OUT));

    expect(() =>
      postava.servisi.utakmice.spremiDogadjaj(utakmica.id, izmjena(utakmica.id, igrac, 4, 0, SubstitutionDirection.OUT))
    ).toThrow(PogreskaProvjere);
  });

  it("odbija ulazak igrača koji je već na terenu", () => {
    const postava = pripremi();
    const utakmica = registriraj(postava);
    const igrac = prviIgrac(postava.domaciIgraci);

    expect(() =>
      postava.servisi.utakmice.spremiDogadjaj(utakmica.id, izmjena(utakmica.id, igrac, 5, 0, SubstitutionDirection.IN))
    ).toThrow(PogreskaProvjere);
  });

  it("odbija šestog igrača na terenu", () => {
    const postava = pripremi();
    const utakmica = registriraj(postava);
    const sesti = postava.servisi.maticniPodaci.spremiIgraca({
      firstName: "Sesti",
      lastName: "Igrac",
      position: Position.SG,
      heightCm: null,
      jerseyNumber: 6,
      teamId: postava.domaci.id
    });

    expect(() =>
      postava.servisi.utakmice.spremiDogadjaj(utakmica.id, izmjena(utakmica.id, sesti, 5, 0, SubstitutionDirection.IN))
    ).toThrow(PogreskaProvjere);
  });

  it("prihvaća zamjenu u istoj sekundi, izlazak pa ulazak", () => {
    const postava = pripremi();
    const utakmica = registriraj(postava);
    const izlazi = prviIgrac(postava.domaciIgraci);
    const ulazi = postava.servisi.maticniPodaci.spremiIgraca({
      firstName: "Sesti",
      lastName: "Igrac",
      position: Position.SG,
      heightCm: null,
      jerseyNumber: 6,
      teamId: postava.domaci.id
    });

    postava.servisi.utakmice.spremiDogadjaj(utakmica.id, izmjena(utakmica.id, izlazi, 5, 0, SubstitutionDirection.OUT));
    const ulazak = postava.servisi.utakmice.spremiDogadjaj(
      utakmica.id,
      izmjena(utakmica.id, ulazi, 5, 0, SubstitutionDirection.IN)
    );

    expect(ulazak.id).toBeGreaterThan(0);
  });
});

describe("analitički servis", () => {
  it("računa pokazatelje igrača i tima nad unesenim događajima", () => {
    const postava = pripremi();
    const utakmica = registriraj(postava);
    const strijelac = prviIgrac(postava.domaciIgraci);

    postava.servisi.utakmice.spremiDogadjaj(utakmica.id, {
      type: EventType.SHOT,
      gameId: utakmica.id,
      playerId: strijelac.id,
      teamId: strijelac.teamId,
      quarter: 1,
      minute: 7,
      second: 46,
      points: 2,
      made: true
    });

    const igracka = postava.servisi.analitika.izracunajPokazateljeIgraca(utakmica.id, strijelac.id);
    const timska = postava.servisi.analitika.izracunajPokazateljeTima(utakmica.id, postava.domaci.id);

    expect(igracka.boxScore?.points).toBe(2);
    expect(igracka.plusMinus).toBe(2);
    expect(igracka.trueShootingPercentage).toBe(1);
    expect(timska.teamId).toBe(postava.domaci.id);
  });

  it("sažetak utakmice sadrži oba tima s njihovim igračima", () => {
    const postava = pripremi();
    const utakmica = registriraj(postava);

    const sazetak = postava.servisi.analitika.izracunajSazetakUtakmice(utakmica.id);

    expect(sazetak.game.id).toBe(utakmica.id);
    expect(sazetak.home.team.id).toBe(postava.domaci.id);
    expect(sazetak.away.team.id).toBe(postava.gosti.id);
    expect(sazetak.home.players).toHaveLength(5);
    expect(sazetak.away.players).toHaveLength(5);
  });

  it("javlja da tražena utakmica ne postoji", () => {
    const { servisi } = pripremi();

    expect(() => servisi.analitika.izracunajSazetakUtakmice(404)).toThrow(PogreskaNepostojecegZapisa);
  });
});

function prviIgrac(igraci: readonly Player[]): Player {
  const igrac = igraci[0];

  if (igrac === undefined) {
    throw new Error("postava nema igrača");
  }

  return igrac;
}

function izmjena(
  gameId: number,
  igrac: Player,
  minute: number,
  second: number,
  direction: SubstitutionDirection
) {
  return {
    type: EventType.SUBSTITUTION,
    gameId,
    playerId: igrac.id,
    teamId: igrac.teamId,
    quarter: 1,
    minute,
    second,
    direction
  } as const;
}
