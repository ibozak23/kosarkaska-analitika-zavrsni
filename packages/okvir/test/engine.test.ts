import { describe, expect, it } from "vitest";

import { EventType, GameStatus, Position, StatisticsEngine, SubstitutionDirection } from "../src/index.js";
import type { Game, GameEvent, Player, PlayerContext, StatisticCalculator, Team, TeamContext } from "../src/index.js";

const tim: Team = { id: 1, name: "Zagreb", city: null, league: null, season: null };

const igrac: Player = {
  id: 7,
  firstName: "Ivan",
  lastName: "Horvat",
  position: Position.PG,
  heightCm: null,
  jerseyNumber: 7,
  teamId: tim.id
};

const utakmica: Game = {
  id: 1,
  playedAt: new Date("2026-03-14T19:00:00.000Z"),
  homeTeamId: tim.id,
  awayTeamId: 2,
  status: GameStatus.FINISHED
};

const kontekstIgraca: PlayerContext = { game: utakmica, player: igrac };
const kontekstTima: TeamContext = { game: utakmica, team: tim };

function faul(id: number, quarter: number, minute: number, second: number): GameEvent {
  return {
    id,
    gameId: utakmica.id,
    playerId: igrac.id,
    teamId: tim.id,
    quarter,
    minute,
    second,
    type: EventType.FOUL
  };
}

function izmjena(id: number, minute: number, second: number, direction: SubstitutionDirection): GameEvent {
  return {
    id,
    gameId: utakmica.id,
    playerId: igrac.id,
    teamId: tim.id,
    quarter: 1,
    minute,
    second,
    type: EventType.SUBSTITUTION,
    direction
  };
}

const dogadaji: readonly GameEvent[] = [
  faul(1, 2, 5, 0),
  izmjena(2, 5, 0, SubstitutionDirection.IN),
  faul(3, 1, 5, 0),
  izmjena(4, 5, 0, SubstitutionDirection.OUT)
];

class BrojacFaulova implements StatisticCalculator<PlayerContext, number> {
  readonly name = "brojFaulova";

  calculate(kontekst: PlayerContext, dogadaji: readonly GameEvent[]): number {
    return dogadaji.filter(
      (dogadaj) => dogadaj.type === EventType.FOUL && dogadaj.playerId === kontekst.player.id
    ).length;
  }
}

class ZapisnikRedoslijeda implements StatisticCalculator<PlayerContext, readonly number[]> {
  readonly name = "redoslijed";

  calculate(kontekst: PlayerContext, dogadaji: readonly GameEvent[]): readonly number[] {
    return dogadaji.map((dogadaj) => dogadaj.id);
  }
}

class BrojacDogadajaTima implements StatisticCalculator<TeamContext, number> {
  readonly name = "brojDogadaja";

  calculate(kontekst: TeamContext, dogadaji: readonly GameEvent[]): number {
    return dogadaji.filter((dogadaj) => dogadaj.teamId === kontekst.team.id).length;
  }
}

describe("analitički modul", () => {
  it("vanjski kalkulator registrira se i poziva bez izmjene koda okvira", () => {
    const modul = new StatisticsEngine();
    modul.registerPlayerCalculator(new BrojacFaulova());

    const rezultat = modul.calculatePlayerStats(kontekstIgraca, dogadaji);

    expect(rezultat.playerId).toBe(igrac.id);
    expect(rezultat.custom.get("brojFaulova")).toBe(2);
  });

  it("timski kalkulator vraća rezultat pod svojim imenom", () => {
    const modul = new StatisticsEngine();
    modul.registerTeamCalculator(new BrojacDogadajaTima());

    const rezultat = modul.calculateTeamStats(kontekstTima, dogadaji);

    expect(rezultat.teamId).toBe(tim.id);
    expect(rezultat.custom.get("brojDogadaja")).toBe(4);
  });

  // 4 — izlazak, 1. četvrtina 5:00
  // 2 — ulazak,  1. četvrtina 5:00
  // 3 — faul,    1. četvrtina 5:00
  // 1 — faul,    2. četvrtina 5:00
  it("kalkulator dobiva događaje poredane kronološki", () => {
    const modul = new StatisticsEngine();
    modul.registerPlayerCalculator(new ZapisnikRedoslijeda());

    const rezultat = modul.calculatePlayerStats(kontekstIgraca, dogadaji);

    expect(rezultat.custom.get("redoslijed")).toEqual([4, 2, 3, 1]);
  });

  it("predani niz događaja ostaje nepromijenjen", () => {
    const modul = new StatisticsEngine();
    modul.registerPlayerCalculator(new ZapisnikRedoslijeda());
    modul.calculatePlayerStats(kontekstIgraca, dogadaji);

    expect(dogadaji.map((dogadaj) => dogadaj.id)).toEqual([1, 2, 3, 4]);
  });

  it("modul poziva kalkulatore redom kojim su registrirani", () => {
    const modul = new StatisticsEngine();
    modul.registerPlayerCalculator(new BrojacFaulova());
    modul.registerPlayerCalculator(new ZapisnikRedoslijeda());

    const rezultat = modul.calculatePlayerStats(kontekstIgraca, dogadaji);

    expect([...rezultat.custom.keys()]).toEqual(["brojFaulova", "redoslijed"]);
  });

  it("dva kalkulatora istog imena ne mogu se registrirati", () => {
    const modul = new StatisticsEngine();
    modul.registerPlayerCalculator(new BrojacFaulova());

    expect(() => modul.registerPlayerCalculator(new BrojacFaulova())).toThrow();
  });
});
