// Baza svakog događaj 
import type { Entity } from "../internal/entity.js";

export interface GameEventBase extends Entity {
  readonly gameId: number;
  readonly playerId: number;
  readonly teamId: number;
  readonly quarter: number;
  readonly minute: number;
  readonly second: number;
}
