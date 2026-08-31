// Defenzivni pokazatelj tima: koliko poena tim PRIMI na 100 posjeda.
import type { GameEvent } from "../../domain/events/game-event.js";
import type { StatisticCalculator } from "../calculator.js";
import type { TeamContext } from "../context.js";
import { filterEventsByTeam } from "../internal/filters.js";
import { RESULT_DECIMALS, roundTo } from "../internal/numbers.js";
import { estimatePossessions } from "../internal/possessions.js";
import { opponentTeamId } from "../internal/teams.js";
import { sumEventTotals } from "../internal/totals.js";

const PER_POSSESSIONS = 100;

export class DefensiveRatingCalculator implements StatisticCalculator<TeamContext, number | null> {
  readonly name = "defensiveRating";

  calculate(context: TeamContext, events: readonly GameEvent[]): number | null {
    const opponent = opponentTeamId(context);
    const possessions = estimatePossessions(events, opponent);

    if (possessions <= 0) {
      return null;
    }

    const totals = sumEventTotals(filterEventsByTeam(events, opponent));

    return roundTo(totals.points / possessions * PER_POSSESSIONS, RESULT_DECIMALS);
  }
}
