import type { EventType } from "../enums.js";
import type { GameEventBase } from "./base.js";

export interface ShotEvent extends GameEventBase {
  readonly type: EventType.SHOT;
  readonly points: 1 | 2 | 3;
  readonly made: boolean;
}
