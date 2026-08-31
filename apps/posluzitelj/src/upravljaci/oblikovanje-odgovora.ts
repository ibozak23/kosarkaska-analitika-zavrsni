import type { Game, Player, PlayerStats, Team, TeamStats } from "@ibozak23/kosarkaska-analitika";
import type { SazetakUtakmice, SazetakTima } from "../servisi/servis-analitike.js";

export interface OblikovaniPokazateljiIgraca extends Omit<PlayerStats, "custom"> {
  readonly custom: Record<string, unknown>;
}

export interface OblikovaniPokazateljiTima extends Omit<TeamStats, "custom"> {
  readonly custom: Record<string, unknown>;
}

export interface OblikovaniRedakIgraca {
  readonly player: Player;
  readonly stats: OblikovaniPokazateljiIgraca;
}

export interface OblikovaniSazetakTima {
  readonly team: Team;
  readonly stats: OblikovaniPokazateljiTima;
  readonly players: readonly OblikovaniRedakIgraca[];
}

export interface OblikovaniSazetakUtakmice {
  readonly game: Game;
  readonly home: OblikovaniSazetakTima;
  readonly away: OblikovaniSazetakTima;
}

export function oblikujPokazateljeIgraca(stats: PlayerStats): OblikovaniPokazateljiIgraca {
  return { ...stats, custom: Object.fromEntries(stats.custom) };
}

export function oblikujPokazateljeTima(stats: TeamStats): OblikovaniPokazateljiTima {
  return { ...stats, custom: Object.fromEntries(stats.custom) };
}

function oblikujSazetakTima(sazetak: SazetakTima): OblikovaniSazetakTima {
  return {
    team: sazetak.team,
    stats: oblikujPokazateljeTima(sazetak.stats),
    players: sazetak.players.map((redak) => ({
      player: redak.player,
      stats: oblikujPokazateljeIgraca(redak.stats)
    }))
  };
}

export function oblikujSazetakUtakmice(sazetak: SazetakUtakmice): OblikovaniSazetakUtakmice {
  return {
    game: sazetak.game,
    home: oblikujSazetakTima(sazetak.home),
    away: oblikujSazetakTima(sazetak.away)
  };
}
