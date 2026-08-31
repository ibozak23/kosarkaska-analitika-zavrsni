// Osnovni učinak igrača
export interface BoxScore {
  readonly points: number;
  readonly fieldGoalsMade: number;
  readonly fieldGoalsAttempted: number;
  readonly threePointersMade: number;
  readonly threePointersAttempted: number;
  readonly freeThrowsMade: number;
  readonly freeThrowsAttempted: number;
  readonly fieldGoalPercentage: number | null;
  readonly threePointPercentage: number | null;
  readonly freeThrowPercentage: number | null;
  readonly offensiveRebounds: number;
  readonly defensiveRebounds: number;
  readonly totalRebounds: number;
  readonly assists: number;
  readonly turnovers: number;
  readonly steals: number;
  readonly blocks: number;
  readonly personalFouls: number;
  readonly playedSeconds: number;
}

// Sve što motor izračuna za jednog igrača.
export interface PlayerStats {
  readonly playerId: number;
  readonly boxScore: BoxScore | null;
  readonly trueShootingPercentage: number | null;
  readonly plusMinus: number | null;
  readonly playerEfficiencyRating: number | null;
  readonly custom: ReadonlyMap<string, unknown>;
}

// Sve što motor izračuna za jedan tim.
export interface TeamStats {
  readonly teamId: number;
  readonly pace: number | null;
  readonly offensiveRating: number | null;
  readonly defensiveRating: number | null;
  readonly custom: ReadonlyMap<string, unknown>;
}
