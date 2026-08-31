// Koliko je sekundi igrač odigrao
import type { GameEvent } from "../../domain/events/game-event.js";
import { deriveLineups, filterIntervalsByPlayer } from "./lineups.js";

export function derivePlayedSeconds(playerId: number, events: readonly GameEvent[]): number {
  let playedSeconds = 0;

  for (const interval of filterIntervalsByPlayer(deriveLineups(events), playerId)) {
    playedSeconds += interval.endSecond - interval.startSecond;
  }

  return playedSeconds;
}
