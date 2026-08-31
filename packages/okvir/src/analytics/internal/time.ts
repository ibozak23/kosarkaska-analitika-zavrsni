import type { GameEvent } from "../../domain/events/game-event.js";
import type { GameEventBase } from "../../domain/events/base.js";
import { EventType, SubstitutionDirection } from "../../domain/enums.js";

//FIBA pravila
const QUARTER_SECONDS = 600;
const OVERTIME_SECONDS = 300;
const REGULAR_QUARTERS = 4;

export function toAbsoluteSecond(event: GameEventBase): number {
  const remaining = event.minute * 60 + event.second;

  // Redovna četvrtina
  if (event.quarter <= REGULAR_QUARTERS) {
    return (event.quarter - 1) * QUARTER_SECONDS + (QUARTER_SECONDS - remaining);
  }

  // Produžetak
  return REGULAR_QUARTERS * QUARTER_SECONDS + (event.quarter - REGULAR_QUARTERS - 1) * OVERTIME_SECONDS + (OVERTIME_SECONDS - remaining);
}

export function gameEndSecond(events: readonly GameEvent[]): number {
  let lastQuarter = REGULAR_QUARTERS;

  for (const event of events) {
    if (event.quarter > lastQuarter) {
      lastQuarter = event.quarter;
    }
  }

  return REGULAR_QUARTERS * QUARTER_SECONDS + (lastQuarter - REGULAR_QUARTERS) * OVERTIME_SECONDS;
}


function orderWithinSecond(event: GameEvent): number {
  if (event.type !== EventType.SUBSTITUTION) {
    return 2;
  }

  return event.direction === SubstitutionDirection.OUT ? 0 : 1;
}

export function sortEventsChronologically(events: readonly GameEvent[]): readonly GameEvent[] {
  return [...events].sort((left, right) => {
    const difference = toAbsoluteSecond(left) - toAbsoluteSecond(right);

    if (difference !== 0) {
      return difference;
    }

    return orderWithinSecond(left) - orderWithinSecond(right);
  });
}
