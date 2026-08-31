// Prebrojava događaje u brojke
import { EventType } from "../../domain/enums.js";
import type { GameEvent } from "../../domain/events/game-event.js";

const FREE_THROW_POINTS = 1;
const THREE_POINTER_POINTS = 3;

// Koeficijent iz formule za posjede
export const FREE_THROW_WEIGHT = 0.44;

export interface EventTotals {
  readonly points: number;
  readonly fieldGoalsMade: number;
  readonly fieldGoalsAttempted: number;
  readonly threePointersMade: number;
  readonly threePointersAttempted: number;
  readonly freeThrowsMade: number;
  readonly freeThrowsAttempted: number;
  readonly offensiveRebounds: number;
  readonly defensiveRebounds: number;
  readonly totalRebounds: number;
  readonly assists: number;
  readonly turnovers: number;
  readonly steals: number;
  readonly blocks: number;
  readonly personalFouls: number;
}

export function sumEventTotals(events: readonly GameEvent[]): EventTotals {
  const totals = {
    points: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    offensiveRebounds: 0,
    defensiveRebounds: 0,
    assists: 0,
    turnovers: 0,
    steals: 0,
    blocks: 0,
    personalFouls: 0
  };

  for (const event of events) {

    switch (event.type) {
      case EventType.SHOT:
        if (event.points === FREE_THROW_POINTS) {
          totals.freeThrowsAttempted += 1;

          if (event.made) {
            totals.freeThrowsMade += 1;
          }
        } 
        else {
          totals.fieldGoalsAttempted += 1;

          if (event.points === THREE_POINTER_POINTS) {
            totals.threePointersAttempted += 1;
          }

          if (event.made) {
            totals.fieldGoalsMade += 1;

            if (event.points === THREE_POINTER_POINTS) {
              totals.threePointersMade += 1;
            }
          }
        }

        if (event.made) {
          totals.points += event.points;
        }

        break;
      case EventType.REBOUND_OFF:
        totals.offensiveRebounds += 1;
        break;
      case EventType.REBOUND_DEF:
        totals.defensiveRebounds += 1;
        break;
      case EventType.ASSIST:
        totals.assists += 1;
        break;
      case EventType.TURNOVER:
        totals.turnovers += 1;
        break;
      case EventType.STEAL:
        totals.steals += 1;
        break;
      case EventType.BLOCK:
        totals.blocks += 1;
        break;
      case EventType.FOUL:
        totals.personalFouls += 1;
        break;
      case EventType.SUBSTITUTION:
        break;
    }
  }

  return { ...totals, totalRebounds: totals.offensiveRebounds + totals.defensiveRebounds };
}
