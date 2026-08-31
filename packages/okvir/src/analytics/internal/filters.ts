// Suženje niza događaja na jednog igrača ili jedan tim.
import type { GameEvent } from "../../domain/events/game-event.js";

export function filterEventsByPlayer(
  events: readonly GameEvent[],
  playerId: number
): readonly GameEvent[] {
  return events.filter((event) => event.playerId === playerId);
}

export function filterEventsByTeam(
  events: readonly GameEvent[],
  teamId: number
): readonly GameEvent[] {
  return events.filter((event) => event.teamId === teamId);
}
