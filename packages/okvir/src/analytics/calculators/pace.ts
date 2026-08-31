// Tempo utakmice: koliko bi posjeda momčad imala u 40 minuta.
import type { GameEvent } from "../../domain/events/game-event.js";
import type { StatisticCalculator } from "../calculator.js";
import type { TeamContext } from "../context.js";
import { RESULT_DECIMALS, roundTo } from "../internal/numbers.js";
import { estimatePossessions } from "../internal/possessions.js";
import { opponentTeamId } from "../internal/teams.js";
import { gameEndSecond } from "../internal/time.js";

// FIBA pravila
const REGULATION_MINUTES = 40;
const SECONDS_PER_MINUTE = 60;

export class PaceCalculator implements StatisticCalculator<TeamContext, number | null> {
  readonly name = "pace";

  calculate(context: TeamContext, events: readonly GameEvent[]): number | null {
    const own = estimatePossessions(events, context.team.id);
    const opponent = estimatePossessions(events, opponentTeamId(context));

    if (own + opponent === 0) {
      return null;
    }

    const minutes = gameEndSecond(events) / SECONDS_PER_MINUTE;

    return roundTo(REGULATION_MINUTES * ((own + opponent) / 2) / minutes, RESULT_DECIMALS);
  }
}
