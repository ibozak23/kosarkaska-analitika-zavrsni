import type { TeamContext } from "../context.js";

export function opponentTeamId(context: TeamContext): number {
  return context.game.homeTeamId === context.team.id
    ? context.game.awayTeamId
    : context.game.homeTeamId;
}
