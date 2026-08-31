// Postotak koji u jedan broj spaja dvojke, trice i slobodna bacanja.
import type { GameEvent } from "../../domain/events/game-event.js";
import type { StatisticCalculator } from "../calculator.js";
import type { PlayerContext } from "../context.js";
import { filterEventsByPlayer } from "../internal/filters.js";
import { RESULT_DECIMALS, roundTo } from "../internal/numbers.js";
import { FREE_THROW_WEIGHT, sumEventTotals } from "../internal/totals.js";

export class TrueShootingCalculator implements StatisticCalculator<PlayerContext, number | null> {
  readonly name = "trueShooting";

  calculate(context: PlayerContext, events: readonly GameEvent[]): number | null {
    const totals = sumEventTotals(filterEventsByPlayer(events, context.player.id));
    const attempts = totals.fieldGoalsAttempted + FREE_THROW_WEIGHT * totals.freeThrowsAttempted;

    if (attempts === 0) {
      return null;
    }
    
    return roundTo(totals.points / 2 / attempts, RESULT_DECIMALS);
  }
}
