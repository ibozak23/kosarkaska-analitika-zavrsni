import type { EventType } from "../enums.js";
import type { GameEventBase } from "./base.js";

export interface AssistEvent extends GameEventBase {
  readonly type: EventType.ASSIST;
}

export interface OffensiveReboundEvent extends GameEventBase {
  readonly type: EventType.REBOUND_OFF;
}

export interface DefensiveReboundEvent extends GameEventBase {
  readonly type: EventType.REBOUND_DEF;
}

export interface FoulEvent extends GameEventBase {
  readonly type: EventType.FOUL;
}

export interface TurnoverEvent extends GameEventBase {
  readonly type: EventType.TURNOVER;
}

export interface BlockEvent extends GameEventBase {
  readonly type: EventType.BLOCK;
}

export interface StealEvent extends GameEventBase {
  readonly type: EventType.STEAL;
}
