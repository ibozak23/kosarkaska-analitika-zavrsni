//Točka proširenja okvira
import type { GameEvent } from "../domain/events/game-event.js";

export interface StatisticCalculator<TContext, TResult> {
  readonly name: string;
  calculate(context: TContext, events: readonly GameEvent[]): TResult;
}
