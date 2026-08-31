import type { Entity } from "./internal/entity.js";

export interface Team extends Entity {
  readonly name: string;
  readonly city: string | null;
  readonly league: string | null;
  readonly season: string | null;
}
