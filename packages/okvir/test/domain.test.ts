import { describe, expect, it } from "vitest";

import { GameStatus, Position } from "../src/index.js";
import type { Game, Player, Team } from "../src/index.js";

describe("nabrojani tipovi", () => {
  it("pozicija ima pet vrijednosti", () => {
    expect(Object.values(Position)).toEqual(["PG", "SG", "SF", "PF", "C"]);
  });

  it("status utakmice ima tri vrijednosti", () => {
    expect(Object.values(GameStatus)).toEqual(["SCHEDULED", "IN_PROGRESS", "FINISHED"]);
  });
});

describe("domenski modeli", () => {
  const team: Team = {
    id: 1,
    name: "Zagreb",
    city: "Zagreb",
    league: "A1",
    season: "2025/2026"
  };

  const player: Player = {
    id: 7,
    firstName: "Ivan",
    lastName: "Horvat",
    position: Position.PG,
    heightCm: 188,
    jerseyNumber: 7,
    teamId: team.id
  };

  const game: Game = {
    id: 1,
    playedAt: new Date("2026-03-14T19:00:00.000Z"),
    homeTeamId: team.id,
    awayTeamId: 2,
    status: GameStatus.FINISHED
  };

  it("Neobavezna polja primaju vrijednost null", () => {
    const nepotpun: Player = {
      ...player,
      heightCm: null,
      jerseyNumber: null
    };

    expect(nepotpun.heightCm).toBeNull();
    expect(nepotpun.jerseyNumber).toBeNull();
  });

  it("igrač i utakmica pokazuju na tim id-em", () => {
    expect(player.teamId).toBe(team.id);
    expect(game.homeTeamId).toBe(team.id);
  });
});
