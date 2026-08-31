import { describe, expect, it } from "vitest";

import { EventType, GameStatus, InvalidEventSequenceError, PlayerBoxScoreCalculator, Position, StatisticsEngine, SubstitutionDirection } from "../src/index.js";
import type { Game, GameEvent, Player, PlayerContext, Team } from "../src/index.js";

const domaci: Team = { id: 1, name: "Domaci", city: null, league: null, season: null };

const igrac: Player = {
  id: 7,
  firstName: "Ivan",
  lastName: "Horvat",
  position: Position.PG,
  heightCm: null,
  jerseyNumber: 7,
  teamId: domaci.id
};

const utakmica: Game = {
  id: 1,
  playedAt: new Date("2026-03-14T19:00:00.000Z"),
  homeTeamId: domaci.id,
  awayTeamId: 2,
  status: GameStatus.FINISHED
};

const kontekst: PlayerContext = { game: utakmica, player: igrac };

function osnova(id: number, quarter: number, minute: number, second: number, playerId = igrac.id, teamId = domaci.id) {
  return { id, gameId: utakmica.id, playerId, teamId, quarter, minute, second };
}

const dogadaji: readonly GameEvent[] = [
  { ...osnova(1, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(2, 1, 8, 0), type: EventType.FOUL },
  { ...osnova(3, 1, 7, 46), type: EventType.SHOT, points: 2, made: true },
  { ...osnova(4, 1, 6, 20, 21, 2), type: EventType.SHOT, points: 3, made: true },
  { ...osnova(5, 1, 5, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.OUT },
  { ...osnova(6, 1, 2, 40, 9), type: EventType.SHOT, points: 2, made: true },
  { ...osnova(7, 2, 9, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(8, 2, 8, 30), type: EventType.REBOUND_OFF },
  { ...osnova(9, 2, 8, 0), type: EventType.REBOUND_DEF },
  { ...osnova(10, 2, 7, 30), type: EventType.REBOUND_DEF },
  { ...osnova(11, 2, 7, 0), type: EventType.ASSIST },
  { ...osnova(12, 2, 6, 30), type: EventType.TURNOVER },
  { ...osnova(13, 2, 6, 0), type: EventType.STEAL },
  { ...osnova(14, 2, 5, 50), type: EventType.SHOT, points: 3, made: true },
  { ...osnova(15, 2, 5, 30), type: EventType.BLOCK },
  { ...osnova(16, 2, 4, 55), type: EventType.SHOT, points: 1, made: true },
  { ...osnova(17, 2, 4, 50), type: EventType.SHOT, points: 1, made: true },
  { ...osnova(18, 2, 4, 0), type: EventType.SHOT, points: 2, made: false },
  { ...osnova(19, 2, 3, 30), type: EventType.SHOT, points: 3, made: false },
  { ...osnova(20, 2, 3, 0), type: EventType.SHOT, points: 2, made: false },
  { ...osnova(21, 2, 2, 30), type: EventType.SHOT, points: 1, made: false },
  { ...osnova(22, 2, 2, 0), type: EventType.FOUL },
  { ...osnova(23, 3, 4, 30), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.OUT },
  { ...osnova(24, 4, 9, 30), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(25, 4, 5, 0), type: EventType.REBOUND_DEF },
  { ...osnova(26, 4, 4, 0), type: EventType.ASSIST },
  { ...osnova(27, 4, 3, 0), type: EventType.TURNOVER },
  { ...osnova(28, 4, 1, 0), type: EventType.SHOT, points: 2, made: true }
];

describe("Box score igrača", () => {
  const kalkulator = new PlayerBoxScoreCalculator();
  const sazetak = kalkulator.calculate(kontekst, dogadaji);

  it("prebrojava događaje igrača", () => {
    expect(sazetak.points).toBe(9);
    expect(sazetak.fieldGoalsAttempted).toBe(6);
    expect(sazetak.fieldGoalsMade).toBe(3);
    expect(sazetak.threePointersAttempted).toBe(2);
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

  it("računa postotke", () => {
    expect(sazetak.fieldGoalPercentage).toBe(0.5);
    expect(sazetak.threePointPercentage).toBe(0.5);
    expect(sazetak.freeThrowPercentage).toBe(0.667);
  });

  it("izvodi odigrano vrijeme", () => {
    expect(sazetak.playedSeconds).toBe(1740);
  });

  it("postotak bez pokušaja vraća null", () => {
    const rezervni: Player = { ...igrac, id: 12 };
    const prazan = kalkulator.calculate({ game: utakmica, player: rezervni }, dogadaji);

    expect(prazan.fieldGoalPercentage).toBeNull();
    expect(prazan.freeThrowPercentage).toBeNull();
    expect(prazan.points).toBe(0);
    expect(prazan.playedSeconds).toBe(0);
  });

  it("izlazak igrača koji nije na terenu baca grešku", () => {
    const neispravan: readonly GameEvent[] = [
      { ...osnova(1, 1, 5, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.OUT }
    ];

    expect(() => kalkulator.calculate(kontekst, neispravan)).toThrow(InvalidEventSequenceError);
  });

  it("modul vraća box score u polju", () => {
    const modul = new StatisticsEngine();
    modul.registerPlayerCalculator(kalkulator);

    const rezultat = modul.calculatePlayerStats(kontekst, dogadaji);

    expect(rezultat.boxScore?.points).toBe(9);
    expect(rezultat.custom.size).toBe(0);
  });
});
