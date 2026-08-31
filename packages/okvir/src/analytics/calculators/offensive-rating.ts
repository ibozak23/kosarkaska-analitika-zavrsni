// Ofenzivni pokazatelj tima: koliko poena tim postigne na 100 vlastitih posjeda.
import type { GameEvent } from "../../domain/events/game-event.js";
import type { StatisticCalculator } from "../calculator.js";
import type { TeamContext } from "../context.js";
import { filterEventsByTeam } from "../internal/filters.js";
import { RESULT_DECIMALS, roundTo } from "../internal/numbers.js";
import { estimatePossessions } from "../internal/possessions.js";
import { sumEventTotals } from "../internal/totals.js";


const PER_POSSESSIONS = 100;

export class OffensiveRatingCalculator implements StatisticCalculator<TeamContext, number | null> {
  readonly name = "offensiveRating";

  calculate(context: TeamContext, events: readonly GameEvent[]): number | null {
    const possessions = estimatePossessions(events, context.team.id);
    
    if (possessions <= 0) {
      return null;
    }

    const totals = sumEventTotals(filterEventsByTeam(events, context.team.id));

    return roundTo(totals.points / possessions * PER_POSSESSIONS, RESULT_DECIMALS);
  }
}
