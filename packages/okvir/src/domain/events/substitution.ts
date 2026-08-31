import type { EventType, SubstitutionDirection } from "../enums.js";
import type { GameEventBase } from "./base.js";

export interface SubstitutionEvent extends GameEventBase {
  readonly type: EventType.SUBSTITUTION;
  readonly direction: SubstitutionDirection;
}
