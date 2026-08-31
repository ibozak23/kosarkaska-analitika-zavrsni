// Podaci na kojima se provjerava cijeli okvir. 
import { EventType, GameStatus, Position, SubstitutionDirection } from "../src/index.js";
import type { Game, GameEvent, LeagueConstants, Player, Team } from "../src/index.js";

export const domaciTim: Team = {
  id: 1,
  name: "Domaci",
  city: null,
  league: null,
  season: null
};

export const gostujuciTim: Team = {
  id: 2,
  name: "Gosti",
  city: null,
  league: null,
  season: null
};

export const utakmica: Game = {
  id: 1,
  playedAt: new Date("2026-03-14T19:00:00.000Z"),
  homeTeamId: domaciTim.id,
  awayTeamId: gostujuciTim.id,
  status: GameStatus.FINISHED
};

export const igrac7: Player = {
  id: 7,
  firstName: "Ivan",
  lastName: "Horvat",
  position: Position.PG,
  heightCm: null,
  jerseyNumber: 7,
  teamId: domaciTim.id
};

export const rezerva: Player = { ...igrac7, id: 13, jerseyNumber: 13 };

export const ligaskeKonstante: LeagueConstants = {
  fieldGoalsMade: 26,
  fieldGoalsAttempted: 60,
  freeThrowsMade: 13,
  freeThrowsAttempted: 18,
  offensiveRebounds: 10,
  totalRebounds: 38,
  assists: 14,
  turnovers: 15,
  personalFouls: 20,
  points: 70
};

const D = 1;
const G = 2;

function osnova(
  id: number,
  playerId: number,
  teamId: number,
  quarter: number,
  minute: number,
  second: number
) {
  return { id, gameId: utakmica.id, playerId, teamId, quarter, minute, second };
}

export const dogadaji: readonly GameEvent[] = [
  
  { ...osnova(1, 7, D, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(2, 8, D, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(3, 9, D, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(4, 10, D, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(5, 11, D, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(6, 21, G, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(7, 22, G, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(8, 23, G, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(9, 24, G, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(10, 25, G, 1, 10, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },

  { ...osnova(11, 7, D, 1, 9, 20), type: EventType.REBOUND_DEF },
  { ...osnova(12, 22, G, 1, 9, 0), type: EventType.SHOT, points: 2, made: false },
  { ...osnova(13, 23, G, 1, 8, 55), type: EventType.REBOUND_OFF },
  { ...osnova(14, 7, D, 1, 8, 0), type: EventType.FOUL },
  { ...osnova(15, 7, D, 1, 7, 46), type: EventType.SHOT, points: 2, made: true },
  { ...osnova(16, 24, G, 1, 7, 0), type: EventType.TURNOVER },
  { ...osnova(17, 7, D, 1, 6, 40), type: EventType.TURNOVER },
  { ...osnova(18, 22, G, 1, 6, 40), type: EventType.STEAL },
  { ...osnova(19, 21, G, 1, 6, 20), type: EventType.SHOT, points: 3, made: true },
  { ...osnova(20, 7, D, 1, 5, 30), type: EventType.STEAL },
  { ...osnova(21, 7, D, 1, 5, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.OUT },
  { ...osnova(22, 25, G, 1, 4, 30), type: EventType.FOUL },
  { ...osnova(23, 10, D, 1, 4, 0), type: EventType.REBOUND_DEF },
  { ...osnova(24, 23, G, 1, 3, 30), type: EventType.SHOT, points: 3, made: false },
  { ...osnova(25, 8, D, 1, 2, 40), type: EventType.ASSIST },
  { ...osnova(26, 9, D, 1, 2, 40), type: EventType.SHOT, points: 2, made: true },
  { ...osnova(27, 22, G, 1, 0, 50), type: EventType.ASSIST },
  { ...osnova(28, 21, G, 1, 0, 50), type: EventType.SHOT, points: 2, made: true },

  { ...osnova(29, 7, D, 2, 9, 0), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(30, 7, D, 2, 8, 30), type: EventType.REBOUND_OFF },
  { ...osnova(31, 24, G, 2, 8, 0), type: EventType.SHOT, points: 2, made: false },
  { ...osnova(32, 7, D, 2, 7, 30), type: EventType.REBOUND_DEF },
  { ...osnova(33, 7, D, 2, 7, 0), type: EventType.ASSIST },
  { ...osnova(34, 21, G, 2, 6, 30), type: EventType.SHOT, points: 2, made: true },
  { ...osnova(35, 9, D, 2, 5, 50), type: EventType.ASSIST },
  { ...osnova(36, 7, D, 2, 5, 50), type: EventType.SHOT, points: 3, made: true },
  { ...osnova(37, 25, G, 2, 5, 0), type: EventType.TURNOVER },
  { ...osnova(38, 9, D, 2, 5, 0), type: EventType.STEAL },
  { ...osnova(39, 21, G, 2, 4, 56), type: EventType.FOUL },
  { ...osnova(40, 7, D, 2, 4, 55), type: EventType.SHOT, points: 1, made: true },
  { ...osnova(41, 7, D, 2, 4, 50), type: EventType.SHOT, points: 1, made: true },
  { ...osnova(42, 7, D, 2, 4, 20), type: EventType.BLOCK },
  { ...osnova(43, 7, D, 2, 4, 0), type: EventType.SHOT, points: 2, made: false },
  { ...osnova(44, 24, G, 2, 4, 0), type: EventType.BLOCK },
  { ...osnova(45, 21, G, 2, 3, 55), type: EventType.REBOUND_DEF },
  { ...osnova(46, 7, D, 2, 3, 30), type: EventType.SHOT, points: 3, made: false },
  { ...osnova(47, 22, G, 2, 3, 25), type: EventType.REBOUND_DEF },
  { ...osnova(48, 7, D, 2, 3, 0), type: EventType.SHOT, points: 2, made: false },
  { ...osnova(49, 23, G, 2, 2, 55), type: EventType.REBOUND_DEF },
  { ...osnova(50, 7, D, 2, 2, 40), type: EventType.FOUL },
  { ...osnova(51, 7, D, 2, 2, 30), type: EventType.SHOT, points: 1, made: false },
  { ...osnova(52, 9, D, 2, 2, 28), type: EventType.REBOUND_OFF },
  { ...osnova(53, 22, G, 2, 2, 25), type: EventType.SHOT, points: 1, made: true },
  { ...osnova(54, 22, G, 2, 2, 20), type: EventType.SHOT, points: 1, made: false },
  { ...osnova(55, 23, G, 2, 2, 18), type: EventType.REBOUND_OFF },
  { ...osnova(56, 7, D, 2, 1, 20), type: EventType.TURNOVER },
  { ...osnova(57, 23, G, 2, 1, 20), type: EventType.STEAL },
  { ...osnova(58, 7, D, 2, 1, 15), type: EventType.ASSIST },
  { ...osnova(59, 9, D, 2, 1, 15), type: EventType.SHOT, points: 2, made: true },
  { ...osnova(60, 8, D, 2, 0, 30), type: EventType.TURNOVER },

  { ...osnova(61, 8, D, 3, 9, 0), type: EventType.SHOT, points: 2, made: false },
  { ...osnova(62, 24, G, 3, 8, 55), type: EventType.REBOUND_DEF },
  { ...osnova(63, 23, G, 3, 8, 0), type: EventType.ASSIST },
  { ...osnova(64, 21, G, 3, 8, 0), type: EventType.SHOT, points: 2, made: true },
  { ...osnova(65, 21, G, 3, 6, 0), type: EventType.SHOT, points: 2, made: false },
  { ...osnova(66, 7, D, 3, 5, 0), type: EventType.REBOUND_DEF },
  { ...osnova(67, 7, D, 3, 4, 30), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.OUT },

  { ...osnova(68, 7, D, 4, 9, 30), type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
  { ...osnova(69, 22, G, 4, 8, 0), type: EventType.SHOT, points: 2, made: false },
  { ...osnova(70, 10, D, 4, 6, 0), type: EventType.BLOCK },
  { ...osnova(71, 21, G, 4, 5, 0), type: EventType.TURNOVER },
  { ...osnova(72, 22, G, 4, 4, 0), type: EventType.FOUL },
  { ...osnova(73, 11, D, 4, 3, 0), type: EventType.FOUL },
  { ...osnova(74, 25, G, 4, 2, 0), type: EventType.SHOT, points: 2, made: false },
  { ...osnova(75, 7, D, 4, 1, 0), type: EventType.SHOT, points: 2, made: true }
];
