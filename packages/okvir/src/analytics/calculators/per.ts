// Zbirni pokazatelj koji sve što je igrač napravio svodi na jedan broj po minuti.
import type { GameEvent } from "../../domain/events/game-event.js";
import type { StatisticCalculator } from "../calculator.js";
import type { PlayerContext } from "../context.js";
import type { LeagueConstants } from "../league-constants.js";
import { filterEventsByPlayer, filterEventsByTeam } from "../internal/filters.js";
import { RESULT_DECIMALS, roundTo } from "../internal/numbers.js";
import { derivePlayedSeconds } from "../internal/played-time.js";
import { FREE_THROW_WEIGHT, sumEventTotals } from "../internal/totals.js";

const SECONDS_PER_MINUTE = 60;
const ASSIST_WEIGHT = 2 / 3;
const MISSED_FREE_THROW_WEIGHT = 0.44;
const MISSED_FREE_THROW_REBOUND_WEIGHT = 0.56;

function requirePositive(value: number, label: string): void {
  if (!(value > 0)) {
    throw new Error(`League constant "${label}" must be greater than zero.`);
  }
}

export class PERCalculator implements StatisticCalculator<PlayerContext, number | null> {
  readonly name = "per";

  readonly #valueOfPossession: number;
  readonly #defensiveReboundRate: number;
  readonly #factor: number;
  readonly #foulWeight: number;

  constructor(league: LeagueConstants) {
    const possessions = league.fieldGoalsAttempted - league.offensiveRebounds + league.turnovers + FREE_THROW_WEIGHT * league.freeThrowsAttempted;

    requirePositive(possessions, "derived possessions");
    requirePositive(league.totalRebounds, "totalRebounds");
    requirePositive(league.fieldGoalsMade, "fieldGoalsMade");
    requirePositive(league.freeThrowsMade, "freeThrowsMade");
    requirePositive(league.personalFouls, "personalFouls");

    this.#valueOfPossession = league.points / possessions;
    this.#defensiveReboundRate = (league.totalRebounds - league.offensiveRebounds) / league.totalRebounds;
    this.#factor = ASSIST_WEIGHT - (0.5 * (league.assists / league.fieldGoalsMade)) / (2 * (league.fieldGoalsMade / league.freeThrowsMade));
    this.#foulWeight = league.freeThrowsMade / league.personalFouls - FREE_THROW_WEIGHT * (league.freeThrowsAttempted / league.personalFouls) * this.#valueOfPossession;
  }

  calculate(context: PlayerContext, events: readonly GameEvent[]): number | null {
    const minutes = derivePlayedSeconds(context.player.id, events) / SECONDS_PER_MINUTE;
    const team = sumEventTotals(filterEventsByTeam(events, context.player.teamId));

    if (minutes === 0 || team.fieldGoalsMade === 0) {
      return null;
    }

    const player = sumEventTotals(filterEventsByPlayer(events, context.player.id));
    const assistRatio = team.assists / team.fieldGoalsMade;
    const vop = this.#valueOfPossession;
    const drbRate = this.#defensiveReboundRate;

    const unadjusted = player.threePointersMade + ASSIST_WEIGHT * player.assists + (2 - this.#factor * assistRatio) * player.fieldGoalsMade + player.freeThrowsMade 
    * 0.5 * (1 + (1 - assistRatio) + ASSIST_WEIGHT * assistRatio) - vop * player.turnovers - vop * drbRate * (player.fieldGoalsAttempted - player.fieldGoalsMade)
    - vop * MISSED_FREE_THROW_WEIGHT  * (MISSED_FREE_THROW_WEIGHT + MISSED_FREE_THROW_REBOUND_WEIGHT * drbRate) * (player.freeThrowsAttempted - player.freeThrowsMade)
    + vop * (1 - drbRate) * (player.totalRebounds - player.offensiveRebounds) + vop * drbRate * player.offensiveRebounds + vop * player.steals + vop * drbRate * player.blocks
    - player.personalFouls * this.#foulWeight;

    return roundTo(unadjusted / minutes, RESULT_DECIMALS);
  }
}
