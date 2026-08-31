import { describe, expect, it } from "vitest";

import { DefensiveRatingCalculator, EventType, GameStatus, OffensiveRatingCalculator, PaceCalculator, PERCalculator, PlayerBoxScoreCalculator, PlusMinusCalculator, 
  Position, StatisticsEngine, SubstitutionDirection, TrueShootingCalculator } from "../src/index.js";
import type { Game, GameEvent, Player, PlayerContext, Team, TeamContext } from "../src/index.js";
import { ligaskeKonstante } from "./kontrolna-utakmica.js";

const domaci: Team = { id: 1, name: "Domaci", city: null, league: null, season: null };
const gosti: Team = { id: 2, name: "Gosti", city: null, league: null, season: null };

const utakmica: Game = {
  id: 1,
  playedAt: new Date("2026-03-14T19:00:00.000Z"),
  homeTeamId: domaci.id,
  awayTeamId: gosti.id,
  status: GameStatus.FINISHED
};

function igrac(id: number, teamId: number): Player {
  return {
    id,
    firstName: "Ime",
    lastName: "Prezime",
    position: Position.PG,
    heightCm: null,
    jerseyNumber: id,
    teamId
  };
}

function modul(): StatisticsEngine {
  const engine = new StatisticsEngine();

  engine.registerPlayerCalculator(new PlayerBoxScoreCalculator());
  engine.registerPlayerCalculator(new TrueShootingCalculator());
  engine.registerPlayerCalculator(new PlusMinusCalculator());
  engine.registerPlayerCalculator(new PERCalculator(ligaskeKonstante));
  engine.registerTeamCalculator(new PaceCalculator());
  engine.registerTeamCalculator(new OffensiveRatingCalculator());
  engine.registerTeamCalculator(new DefensiveRatingCalculator());

  return engine;
}

function osnova(id: number, playerId: number, teamId: number, quarter: number, minute: number, second: number) {
  return { id, gameId: utakmica.id, playerId, teamId, quarter, minute, second };
}

function ulazak(id: number, playerId: number, teamId: number): GameEvent {
  return {
    ...osnova(id, playerId, teamId, 1, 10, 0),
    type: EventType.SUBSTITUTION,
    direction: SubstitutionDirection.IN
  };
}

const pocetnePetorke: readonly GameEvent[] = [
  ulazak(1, 7, domaci.id),
  ulazak(2, 8, domaci.id),
  ulazak(3, 9, domaci.id),
  ulazak(4, 10, domaci.id),
  ulazak(5, 11, domaci.id),
  ulazak(6, 21, gosti.id),
  ulazak(7, 22, gosti.id),
  ulazak(8, 23, gosti.id),
  ulazak(9, 24, gosti.id),
  ulazak(10, 25, gosti.id)
];

function pokazateljiIgraca(stats: {
  readonly trueShootingPercentage: number | null;
  readonly plusMinus: number | null;
  readonly playerEfficiencyRating: number | null;
}): readonly (number | null)[] {
  return [stats.trueShootingPercentage, stats.plusMinus, stats.playerEfficiencyRating];
}

describe("utakmica bez ijednog događaja", () => {
  const kontekstIgraca: PlayerContext = { game: utakmica, player: igrac(7, domaci.id) };
  const kontekstTima: TeamContext = { game: utakmica, team: domaci };
  const engine = modul();
  const igracStats = engine.calculatePlayerStats(kontekstIgraca, []);
  const timStats = engine.calculateTeamStats(kontekstTima, []);

  it("sažetak je popunjen nulama, a postotci su null", () => {
    expect(igracStats.boxScore?.points).toBe(0);
    expect(igracStats.boxScore?.playedSeconds).toBe(0);
    expect(igracStats.boxScore?.fieldGoalPercentage).toBeNull();
    expect(igracStats.boxScore?.threePointPercentage).toBeNull();
    expect(igracStats.boxScore?.freeThrowPercentage).toBeNull();
  });

  it("svi ostali pokazatelji igrača su null", () => {
    expect(pokazateljiIgraca(igracStats)).toEqual([null, null, null]);
  });

  it("svi timski pokazatelji su null", () => {
    expect(timStats.pace).toBeNull();
    expect(timStats.offensiveRating).toBeNull();
    expect(timStats.defensiveRating).toBeNull();
  });
});

describe("igrač koji nije ušao u igru", () => {
  const kontekst: PlayerContext = { game: utakmica, player: igrac(12, domaci.id) };
  const dogadaji: readonly GameEvent[] = [
    ...pocetnePetorke,
    { ...osnova(11, 7, domaci.id, 2, 5, 0), type: EventType.SHOT, points: 2, made: true } ];

  const stats = modul().calculatePlayerStats(kontekst, dogadaji);

  it("nema odigranih sekundi, a pokazatelji su null umjesto broja", () => {
    expect(stats.boxScore?.playedSeconds).toBe(0);
    expect(pokazateljiIgraca(stats)).toEqual([null, null, null]);
  });
});

describe("igrač bez ijednog šuta", () => {
  const kontekst: PlayerContext = { game: utakmica, player: igrac(8, domaci.id) };
  const dogadaji: readonly GameEvent[] = [
    ...pocetnePetorke,
    { ...osnova(11, 7, domaci.id, 2, 5, 0), type: EventType.SHOT, points: 2, made: true },
    { ...osnova(12, 8, domaci.id, 2, 4, 0), type: EventType.REBOUND_DEF }
  ];

  const stats = modul().calculatePlayerStats(kontekst, dogadaji);

  it("nazivnik nula daje null, a ne NaN", () => {
    expect(stats.boxScore?.fieldGoalPercentage).toBeNull();
    expect(stats.boxScore?.freeThrowPercentage).toBeNull();
    expect(stats.trueShootingPercentage).toBeNull();
  });

  it("pokazatelji koji ne ovise o šutu ostaju brojevi", () => {
    expect(stats.plusMinus).toBe(2);
    expect(stats.playerEfficiencyRating).not.toBeNull();
    expect(Number.isFinite(stats.playerEfficiencyRating)).toBe(true);
  });
});

describe("utakmica s produžetkom", () => {
  const dogadaji: readonly GameEvent[] = [
    ...pocetnePetorke,
    { ...osnova(11, 21, gosti.id, 5, 4, 0), type: EventType.SHOT, points: 2, made: true },
    { ...osnova(12, 7, domaci.id, 5, 3, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.OUT },
    { ...osnova(13, 9, domaci.id, 5, 1, 0), type: EventType.SHOT, points: 2, made: true }
  ];

  const engine = modul();
  const izmijenjeni = engine.calculatePlayerStats(
    { game: utakmica, player: igrac(7, domaci.id) },
    dogadaji
  );
  const doKraja = engine.calculatePlayerStats(
    { game: utakmica, player: igrac(8, domaci.id) },
    dogadaji
  );
  const timStats = engine.calculateTeamStats({ game: utakmica, team: domaci }, dogadaji);

  it("produžetak produljuje utakmicu na 2700 sekundi", () => {
    expect(doKraja.boxScore?.playedSeconds).toBe(2700);
  });

  it("vrijeme u produžetku prevodi se u ispravnu apsolutnu sekundu", () => {
    expect(izmijenjeni.boxScore?.playedSeconds).toBe(2520);
    expect(izmijenjeni.plusMinus).toBe(-2);
  });

  it("tempo se normira na 40 minuta unatoč duljoj utakmici", () => {
    expect(timStats.pace).toBe(0.889);
    expect(timStats.offensiveRating).toBe(200);
    expect(timStats.defensiveRating).toBe(200);
  });
});

describe("događaj izvan trajanja utakmice", () => {
  const dogadaji: readonly GameEvent[] = [
    { ...osnova(1, 7, domaci.id, 1, 12, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
    { ...osnova(2, 21, gosti.id, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
    { ...osnova(3, 7, domaci.id, 2, 5, 0), type: EventType.SHOT, points: 2, made: true },
    { ...osnova(4, 21, gosti.id, 2, 4, 0), type: EventType.SHOT, points: 3, made: true }
  ];

  const stats = modul().calculatePlayerStats(
    { game: utakmica, player: igrac(7, domaci.id) },
    dogadaji
  );

  it("izračun se ne prekida, nego slijedi zapisano vrijeme", () => {
    expect(stats.boxScore?.playedSeconds).toBe(2520);
    expect(stats.plusMinus).toBe(-1);
  });

  it("nijedan pokazatelj ne vraća NaN ni Infinity", () => {
    for (const pokazatelj of pokazateljiIgraca(stats)) {
      expect(pokazatelj === null || Number.isFinite(pokazatelj)).toBe(true);
    }
  });
});
