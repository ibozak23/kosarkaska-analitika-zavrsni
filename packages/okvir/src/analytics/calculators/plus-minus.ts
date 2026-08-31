// Razlika u koševima dok je igrač bio na terenu
import { EventType } from "../../domain/enums.js";
import type { GameEvent } from "../../domain/events/game-event.js";
import type { StatisticCalculator } from "../calculator.js";
import type { PlayerContext } from "../context.js";
import { deriveLineups, filterIntervalsByPlayer, isOnCourtAt } from "../internal/lineups.js";
import { toAbsoluteSecond } from "../internal/time.js";

export class PlusMinusCalculator implements StatisticCalculator<PlayerContext, number | null> {
  readonly name = "plusMinus";

  calculate(context: PlayerContext, events: readonly GameEvent[]): number | null {
    const intervals = filterIntervalsByPlayer(deriveLineups(events), context.player.id);

    if (intervals.length === 0) {
      return null;
    }

    let plusMinus = 0;

    for (const event of events) {
      if (event.type !== EventType.SHOT || !event.made) {
        continue;
      }

      if (!isOnCourtAt(toAbsoluteSecond(event), intervals)) {
        continue;
      }

      plusMinus += event.teamId === context.player.teamId ? event.points : -event.points;
    }

    return plusMinus;
  }
}
