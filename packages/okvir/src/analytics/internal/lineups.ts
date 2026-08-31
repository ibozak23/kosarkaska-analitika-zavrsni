// Izvodi tko je bio na terenu i kada (played-time.ts) i plus-minus.
import { EventType, SubstitutionDirection } from "../../domain/enums.js";
import type { GameEvent } from "../../domain/events/game-event.js";
import { InvalidEventSequenceError } from "../errors.js";
import { gameEndSecond, toAbsoluteSecond } from "./time.js";

const PLAYERS_ON_COURT = 5;

export interface PlayerInterval {
  readonly playerId: number;
  readonly teamId: number;
  readonly startSecond: number;
  readonly endSecond: number;
}

interface OnCourtEntry {
  readonly teamId: number;
  readonly startSecond: number;
}

type LineupState = Map<number, OnCourtEntry>;

// Koliko igrača tog tima trenutno igra
function countTeamOnCourt(state: LineupState, teamId: number): number {
  let count = 0;

  for (const entry of state.values()) {
    if (entry.teamId === teamId) {
      count += 1;
    }
  }

  return count;
}

export function deriveLineups(events: readonly GameEvent[]): readonly PlayerInterval[] {
  const intervals: PlayerInterval[] = [];
  const state: LineupState = new Map();

  for (const event of events) {
    if (event.type !== EventType.SUBSTITUTION) {
      continue;
    }

    const second = toAbsoluteSecond(event);

    //Ulazak igraca 
    if (event.direction === SubstitutionDirection.IN) {
      if (state.has(event.playerId)) {
        throw new InvalidEventSequenceError(
          "Player entered the court while already on it.",
          event.playerId,
          event.id
        );
      }

      if (countTeamOnCourt(state, event.teamId) === PLAYERS_ON_COURT) {
        throw new InvalidEventSequenceError(
          "A sixth player of the same team entered the court.",
          event.playerId,
          event.id
        );
      }

      state.set(event.playerId, { teamId: event.teamId, startSecond: second });
      continue;
    }

    // Izlazak igrača.
    const onCourt = state.get(event.playerId);

    if (onCourt === undefined) {
      throw new InvalidEventSequenceError(
        "Player left the court without entering it.",
        event.playerId,
        event.id
      );
    }

    intervals.push({
      playerId: event.playerId,
      teamId: onCourt.teamId,
      startSecond: onCourt.startSecond,
      endSecond: second
    });
    state.delete(event.playerId);
  }

  // Računanje intervala za igrače koji su ostali na terenu do kraja
  const endSecond = gameEndSecond(events);
  for (const [playerId, onCourt] of state) {
    intervals.push({
      playerId,
      teamId: onCourt.teamId,
      startSecond: onCourt.startSecond,
      endSecond
    });
  }

  return intervals;
}

export function filterIntervalsByPlayer(
  intervals: readonly PlayerInterval[],
  playerId: number
): readonly PlayerInterval[] {
  return intervals.filter((interval) => interval.playerId === playerId);
}

export function isOnCourtAt(second: number, playerIntervals: readonly PlayerInterval[]): boolean {
  return playerIntervals.some(
    (interval) => second >= interval.startSecond && second < interval.endSecond
  );
}
