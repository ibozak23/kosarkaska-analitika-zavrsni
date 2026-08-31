import type { ShotEvent } from "./shot.js";
import type {
  AssistEvent,
  BlockEvent,
  DefensiveReboundEvent,
  FoulEvent,
  OffensiveReboundEvent,
  StealEvent,
  TurnoverEvent
} from "./simple.js";
import type { SubstitutionEvent } from "./substitution.js";

export type GameEvent =
  | ShotEvent
  | AssistEvent
  | OffensiveReboundEvent
  | DefensiveReboundEvent
  | FoulEvent
  | TurnoverEvent
  | BlockEvent
  | StealEvent
  | SubstitutionEvent;
