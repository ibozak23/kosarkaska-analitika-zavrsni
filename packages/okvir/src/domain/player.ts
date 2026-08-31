import type { Position } from "./enums.js";
import type { Entity } from "./internal/entity.js";

export interface Player extends Entity {
  readonly firstName: string;
  readonly lastName: string;
  readonly position: Position;
  readonly heightCm: number | null;
  readonly jerseyNumber: number | null;
  readonly teamId: number;
}
