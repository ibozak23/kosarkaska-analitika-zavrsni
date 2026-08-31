// Kalkulatore ne stvara sam nego ih prima kroz register metode
import type { GameEvent } from "../domain/events/game-event.js";
import type { StatisticCalculator } from "./calculator.js";
import type { PlayerContext, TeamContext } from "./context.js";
import type { BoxScore, PlayerStats, TeamStats } from "./results.js";
import { PlayerBoxScoreCalculator } from "./calculators/box-score.js";
import { DefensiveRatingCalculator } from "./calculators/defensive-rating.js";
import { OffensiveRatingCalculator } from "./calculators/offensive-rating.js";
import { PaceCalculator } from "./calculators/pace.js";
import { PERCalculator } from "./calculators/per.js";
import { PlusMinusCalculator } from "./calculators/plus-minus.js";
import { TrueShootingCalculator } from "./calculators/true-shooting.js";
import { sortEventsChronologically } from "./internal/time.js";

export class StatisticsEngine {
  readonly #playerCalculators = new Map<string, StatisticCalculator<PlayerContext, unknown>>();
  readonly #teamCalculators = new Map<string, StatisticCalculator<TeamContext, unknown>>();

  registerPlayerCalculator(calculator: StatisticCalculator<PlayerContext, unknown>): void {
    guardAgainstDuplicate(this.#playerCalculators, calculator.name);
    this.#playerCalculators.set(calculator.name, calculator);
  }

  registerTeamCalculator(calculator: StatisticCalculator<TeamContext, unknown>): void {
    guardAgainstDuplicate(this.#teamCalculators, calculator.name);
    this.#teamCalculators.set(calculator.name, calculator);
  }

  // Izračun svih pokazatelja za jednog igrača.
  calculatePlayerStats(context: PlayerContext, events: readonly GameEvent[]): PlayerStats {
    const ordered = sortEventsChronologically(events);
    const custom = new Map<string, unknown>();
    let boxScore: BoxScore | null = null;
    let trueShootingPercentage: number | null = null;
    let plusMinus: number | null = null;
    let playerEfficiencyRating: number | null = null;

    for (const calculator of this.#playerCalculators.values()) {
      if (calculator instanceof PlayerBoxScoreCalculator) {
        boxScore = calculator.calculate(context, ordered);
        continue;
      }

      if (calculator instanceof TrueShootingCalculator) {
        trueShootingPercentage = calculator.calculate(context, ordered);
        continue;
      }

      if (calculator instanceof PlusMinusCalculator) {
        plusMinus = calculator.calculate(context, ordered);
        continue;
      }

      if (calculator instanceof PERCalculator) {
        playerEfficiencyRating = calculator.calculate(context, ordered);
        continue;
      }

      custom.set(calculator.name, calculator.calculate(context, ordered));
    }

    return {
      playerId: context.player.id,
      boxScore,
      trueShootingPercentage,
      plusMinus,
      playerEfficiencyRating,
      custom
    };
  }

  // Tempo, ofenzivni i defenzivni pokazatelj.
  calculateTeamStats(context: TeamContext, events: readonly GameEvent[]): TeamStats {
    const ordered = sortEventsChronologically(events);
    const custom = new Map<string, unknown>();
    let pace: number | null = null;
    let offensiveRating: number | null = null;
    let defensiveRating: number | null = null;

    for (const calculator of this.#teamCalculators.values()) {
      if (calculator instanceof PaceCalculator) {
        pace = calculator.calculate(context, ordered);
        continue;
      }

      if (calculator instanceof OffensiveRatingCalculator) {
        offensiveRating = calculator.calculate(context, ordered);
        continue;
      }

      if (calculator instanceof DefensiveRatingCalculator) {
        defensiveRating = calculator.calculate(context, ordered);
        continue;
      }

      custom.set(calculator.name, calculator.calculate(context, ordered));
    }

    return { teamId: context.team.id, pace, offensiveRating, defensiveRating, custom };
  }
}

function guardAgainstDuplicate(
  calculators: ReadonlyMap<string, unknown>,
  name: string
): void {
  if (calculators.has(name)) {
    throw new Error(`Calculator named "${name}" is already registered.`);
  }
}
