// Procjenjuje koliko je puta tim imao loptu.
import type { GameEvent } from "../../domain/events/game-event.js";
import { filterEventsByTeam } from "./filters.js";
import { FREE_THROW_WEIGHT, sumEventTotals } from "./totals.js";

export function estimatePossessions(events: readonly GameEvent[], teamId: number): number {
  const totals = sumEventTotals(filterEventsByTeam(events, teamId));

  return totals.fieldGoalsAttempted
    + FREE_THROW_WEIGHT * totals.freeThrowsAttempted
    - totals.offensiveRebounds
    + totals.turnovers;
}
