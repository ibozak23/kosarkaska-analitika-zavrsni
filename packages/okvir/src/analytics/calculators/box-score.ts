// Osnovni učinak igrača: poeni, šutevi, skokovi, asistencije, minutaža.
import type { GameEvent } from "../../domain/events/game-event.js";
import type { StatisticCalculator } from "../calculator.js";
import type { PlayerContext } from "../context.js";
import type { BoxScore } from "../results.js";
import { filterEventsByPlayer } from "../internal/filters.js";
import { percentage } from "../internal/numbers.js";
import { derivePlayedSeconds } from "../internal/played-time.js";
import { sumEventTotals } from "../internal/totals.js";

export class PlayerBoxScoreCalculator implements StatisticCalculator<PlayerContext, BoxScore> {
  readonly name = "boxScore";

  calculate(context: PlayerContext, events: readonly GameEvent[]): BoxScore {
    const totals = sumEventTotals(filterEventsByPlayer(events, context.player.id));
    return {
      ...totals,
      fieldGoalPercentage: percentage(totals.fieldGoalsMade, totals.fieldGoalsAttempted),
      threePointPercentage: percentage(totals.threePointersMade, totals.threePointersAttempted),
      freeThrowPercentage: percentage(totals.freeThrowsMade, totals.freeThrowsAttempted),
      playedSeconds: derivePlayedSeconds(context.player.id, events)
    };
  }
}
