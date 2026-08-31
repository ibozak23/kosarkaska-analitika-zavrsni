import type { GameStatus } from "./enums.js";
import type { Entity } from "./internal/entity.js";

export interface Game extends Entity {
  readonly playedAt: Date;
  readonly homeTeamId: number;
  readonly awayTeamId: number;
  readonly status: GameStatus;
}
