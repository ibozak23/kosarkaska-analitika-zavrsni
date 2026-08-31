import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { EventType, GameStatus, Position, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";
import type { Game, Player, Team } from "@ibozak23/kosarkaska-analitika";

import { U_MEMORIJI, otvoriBazu } from "../src/baza/veza-s-bazom.js";
import { RepozitorijDogadjaja } from "../src/repozitoriji/repozitorij-dogadjaja.js";
import type { DogadjajZaUpis } from "../src/repozitoriji/preslikivac-dogadjaja.js";
import { RepozitorijUtakmica } from "../src/repozitoriji/repozitorij-utakmica.js";
import { RepozitorijIgraca } from "../src/repozitoriji/repozitorij-igraca.js";
import { RepozitorijTimova } from "../src/repozitoriji/repozitorij-timova.js";

function otvoriRepozitorije() {
  const baza = otvoriBazu(U_MEMORIJI);

  return {
    baza,
    timovi: new RepozitorijTimova(baza),
    igraci: new RepozitorijIgraca(baza),
    utakmice: new RepozitorijUtakmica(baza),
    dogadjaji: new RepozitorijDogadjaja(baza)
  };
}

function upisiUtakmicu(): {
  baza: Database.Database;
  utakmice: RepozitorijUtakmica;
  dogadjaji: RepozitorijDogadjaja;
  domaci: Team;
  gosti: Team;
  igrac: Player;
  utakmica: Game;
} {
  const { baza, timovi, igraci, utakmice, dogadjaji } = otvoriRepozitorije();

  const domaci = timovi.spremi({ name: "Sokolovi", city: "Zagreb", league: "A1", season: "2025/2026" });
  const gosti = timovi.spremi({ name: "Jastrebovi", city: "Split", league: "A1", season: "2025/2026" });
  const igrac = igraci.spremi({
    firstName: "Ivan",
    lastName: "Horvat",
    position: Position.PG,
    heightCm: 188,
    jerseyNumber: 7,
    teamId: domaci.id
  });
  const utakmica = utakmice.spremi({
    playedAt: new Date("2026-03-14T19:00:00.000Z"),
    homeTeamId: domaci.id,
    awayTeamId: gosti.id,
    status: GameStatus.FINISHED
  });

  return { baza, utakmice, dogadjaji, domaci, gosti, igrac, utakmica };
}

function sut(utakmica: Game, igrac: Player, minute: number, second: number): DogadjajZaUpis {
  return {
    type: EventType.SHOT,
    gameId: utakmica.id,
    playerId: igrac.id,
    teamId: igrac.teamId,
    quarter: 1,
    minute,
    second,
    points: 2,
    made: true
  };
}

describe("shema baze", () => {
  it("stvara se pokretanjem nad praznom datotekom", () => {
    const mapa = mkdtempSync(join(tmpdir(), "analitika-"));
    const putanja = join(mapa, "prazna.db");

    try {
      const baza = otvoriBazu(putanja);
      const objekti = baza
        .prepare<[], { type: string; name: string }>(
          "SELECT type, name FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name"
        )
        .all();
      baza.close();

      const tablice = objekti.filter((objekt) => objekt.type === "table").map((objekt) => objekt.name);
      const indeksi = objekti.filter((objekt) => objekt.type === "index").map((objekt) => objekt.name);

      expect(tablice).toEqual(["game", "game_event", "player", "team"]);
      expect(indeksi).toEqual(["game_event_game_player", "game_event_player", "player_team"]);
    } finally {
      rmSync(mapa, { recursive: true, force: true });
    }
  });
});

describe("repozitorij timova", () => {
  it("zapisuje i čita tim", () => {
    const { timovi } = otvoriRepozitorije();

    const upisan = timovi.spremi({ name: "Sokolovi", city: "Zagreb", league: "A1", season: "2025/2026" });
    const procitan = timovi.dohvatiPoOznaci(upisan.id);

    expect(upisan.id).toBeGreaterThan(0);
    expect(procitan).toEqual(upisan);
    expect(timovi.dohvatiSve()).toEqual([upisan]);
  });

  it("za nepostojeći tim vraća null", () => {
    const { timovi } = otvoriRepozitorije();

    expect(timovi.dohvatiPoOznaci(404)).toBeNull();
  });
});

describe("repozitorij igrača", () => {
  it("zapisuje i čita igrača, uz izostavljene podatke kao null", () => {
    const { timovi, igraci } = otvoriRepozitorije();
    const tim = timovi.spremi({ name: "Sokolovi", city: null, league: null, season: null });

    const upisan = igraci.spremi({
      firstName: "Ivan",
      lastName: "Horvat",
      position: Position.PG,
      heightCm: null,
      jerseyNumber: 7,
      teamId: tim.id
    });
    const procitan = igraci.dohvatiPoOznaci(upisan.id);

    expect(procitan).toEqual(upisan);
    expect(procitan?.position).toBe(Position.PG);
    expect(procitan?.heightCm).toBeNull();
    expect(igraci.dohvatiZaTim(tim.id)).toEqual([upisan]);
  });
});

describe("repozitorij utakmica", () => {
  it("zapisuje i čita utakmicu s datumom u oba smjera", () => {
    const { timovi, utakmice } = otvoriRepozitorije();
    const domaci = timovi.spremi({ name: "Sokolovi", city: null, league: null, season: null });
    const gosti = timovi.spremi({ name: "Jastrebovi", city: null, league: null, season: null });

    const upisana = utakmice.spremi({
      playedAt: new Date("2026-03-14T19:00:00.000Z"),
      homeTeamId: domaci.id,
      awayTeamId: gosti.id,
      status: GameStatus.SCHEDULED
    });
    const procitana = utakmice.dohvatiPoOznaci(upisana.id);

    expect(procitana).toEqual(upisana);
    expect(procitana?.playedAt.toISOString()).toBe("2026-03-14T19:00:00.000Z");
    expect(procitana?.status).toBe(GameStatus.SCHEDULED);
  });
});

describe("repozitorij događaja", () => {
  it("zapisuje i čita događaj kao tip iz hijerarhije okvira", () => {
    const { dogadjaji, igrac, utakmica } = upisiUtakmicu();

    const upisan = dogadjaji.spremi(sut(utakmica, igrac, 7, 46));
    const procitani = dogadjaji.dohvatiZaUtakmicu(utakmica.id);

    expect(upisan.id).toBeGreaterThan(0);
    expect(upisan.type).toBe(EventType.SHOT);
    expect(procitani).toEqual([upisan]);
  });

  it("vraća događaje kronološki, po padajućem preostalom vremenu", () => {
    const { dogadjaji, igrac, utakmica } = upisiUtakmicu();

    dogadjaji.spremiVise([sut(utakmica, igrac, 2, 30), sut(utakmica, igrac, 9, 10), sut(utakmica, igrac, 7, 46)]);

    const vremena = dogadjaji
      .dohvatiZaUtakmicu(utakmica.id)
      .map((dogadjaj) => `${dogadjaj.minute}:${dogadjaj.second}`);

    expect(vremena).toEqual(["9:10", "7:46", "2:30"]);
  });

  it("zapisuje i čita svih devet vrsta događaja", () => {
    const { dogadjaji, igrac, utakmica } = upisiUtakmicu();
    const osnova = {
      gameId: utakmica.id,
      playerId: igrac.id,
      teamId: igrac.teamId,
      quarter: 1,
      minute: 5,
      second: 0
    };

    const upisani = dogadjaji.spremiVise([
      { ...osnova, type: EventType.SHOT, points: 2, made: true },
      { ...osnova, type: EventType.ASSIST },
      { ...osnova, type: EventType.REBOUND_OFF },
      { ...osnova, type: EventType.REBOUND_DEF },
      { ...osnova, type: EventType.FOUL },
      { ...osnova, type: EventType.TURNOVER },
      { ...osnova, type: EventType.BLOCK },
      { ...osnova, type: EventType.STEAL },
      { ...osnova, type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN }
    ]);

    expect(upisani).toHaveLength(9);
    expect(dogadjaji.dohvatiZaUtakmicu(utakmica.id)).toEqual(upisani);
  });
});

describe("ograničenja sheme", () => {
  it("odbija događaj koji nije šut, a nosi podatke o šutu", () => {
    const { baza, igrac, utakmica } = upisiUtakmicu();

    const rucniUpis = baza.prepare(
      `INSERT INTO game_event (game_id, player_id, team_id, event_type, quarter, minute, second,
                               shot_points, shot_made, substitution_direction)
       VALUES (?, ?, ?, 'ASSIST', 1, 5, 0, 2, 1, NULL)`
    );

    expect(() => rucniUpis.run(utakmica.id, igrac.id, igrac.teamId)).toThrow(
      /CHECK constraint failed/
    );
  });

  it("odbija vrijeme izvan trajanja četvrtine", () => {
    const { dogadjaji, igrac, utakmica } = upisiUtakmicu();

    expect(() => dogadjaji.spremi(sut(utakmica, igrac, 10, 30))).toThrow(/CHECK constraint failed/);
  });

  it("odbija brisanje tima koji ima igrače", () => {
    const { timovi, igraci } = otvoriRepozitorije();
    const tim = timovi.spremi({ name: "Sokolovi", city: null, league: null, season: null });
    igraci.spremi({
      firstName: "Ivan",
      lastName: "Horvat",
      position: Position.C,
      heightCm: null,
      jerseyNumber: null,
      teamId: tim.id
    });

    expect(() => timovi.obrisi(tim.id)).toThrow(/FOREIGN KEY constraint failed/);
  });
});
