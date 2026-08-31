import { describe, expect, it } from "vitest";

import { EventType, PlayerBoxScoreCalculator } from "../src/index.js";
import type { GameEvent } from "../src/index.js";
import { dogadaji, domaciTim, gostujuciTim, igrac7, utakmica } from "./kontrolna-utakmica.js";


describe("kontrolni skup podataka", () => {
  const sazetak = new PlayerBoxScoreCalculator().calculate(
    { game: utakmica, player: igrac7 },
    dogadaji
  );

  it("daje dobar box score igrača 7", () => {
    expect(sazetak.playedSeconds / 60).toBe(29);
    expect(sazetak.points).toBe(9);
    expect(sazetak.fieldGoalsAttempted).toBe(6);
    expect(sazetak.fieldGoalsMade).toBe(3);
    expect(sazetak.threePointersMade).toBe(1);
    expect(sazetak.freeThrowsAttempted).toBe(3);
    expect(sazetak.freeThrowsMade).toBe(2);
    expect(sazetak.offensiveRebounds).toBe(1);
    expect(sazetak.defensiveRebounds).toBe(3);
    expect(sazetak.totalRebounds).toBe(4);
    expect(sazetak.assists).toBe(2);
    expect(sazetak.turnovers).toBe(2);
    expect(sazetak.steals).toBe(1);
    expect(sazetak.blocks).toBe(1);
    expect(sazetak.personalFouls).toBe(2);
  });

  it("daje zapisane zbrojeve obaju timova", () => {
    expect(zbrojiTim(domaciTim.id)).toEqual({
      points: 13,
      fieldGoalsAttempted: 9,
      fieldGoalsMade: 5,
      freeThrowsAttempted: 3,
      freeThrowsMade: 2,
      offensiveRebounds: 2,
      defensiveRebounds: 4,
      assists: 4,
      turnovers: 3,
      steals: 2,
      blocks: 2,
      personalFouls: 3
    });

    expect(zbrojiTim(gostujuciTim.id)).toEqual({
      points: 10,
      fieldGoalsAttempted: 10,
      fieldGoalsMade: 4,
      freeThrowsAttempted: 2,
      freeThrowsMade: 1,
      offensiveRebounds: 2,
      defensiveRebounds: 4,
      assists: 2,
      turnovers: 3,
      steals: 2,
      blocks: 1,
      personalFouls: 3
    });
  });
});

function zbrojiTim(teamId: number) {
  const zbroj = {
    points: 0,
    fieldGoalsAttempted: 0,
    fieldGoalsMade: 0,
    freeThrowsAttempted: 0,
    freeThrowsMade: 0,
    offensiveRebounds: 0,
    defensiveRebounds: 0,
    assists: 0,
    turnovers: 0,
    steals: 0,
    blocks: 0,
    personalFouls: 0
  };

  for (const dogadaj of dogadaji) {
    if (dogadaj.teamId !== teamId) {
      continue;
    }

    prebroji(zbroj, dogadaj);
  }

  return zbroj;
}

function prebroji(zbroj: ReturnType<typeof zbrojiTim>, dogadaj: GameEvent): void {
  switch (dogadaj.type) {
    case EventType.SHOT:
      if (dogadaj.points === 1) {
        zbroj.freeThrowsAttempted += 1;
      } else {
        zbroj.fieldGoalsAttempted += 1;
      }

      if (dogadaj.made) {
        zbroj.points += dogadaj.points;

        if (dogadaj.points === 1) {
          zbroj.freeThrowsMade += 1;
        } else {
          zbroj.fieldGoalsMade += 1;
        }
      }
      break;
    case EventType.REBOUND_OFF:
      zbroj.offensiveRebounds += 1;
      break;
    case EventType.REBOUND_DEF:
      zbroj.defensiveRebounds += 1;
      break;
    case EventType.ASSIST:
      zbroj.assists += 1;
      break;
    case EventType.TURNOVER:
      zbroj.turnovers += 1;
      break;
    case EventType.STEAL:
      zbroj.steals += 1;
      break;
    case EventType.BLOCK:
      zbroj.blocks += 1;
      break;
    case EventType.FOUL:
      zbroj.personalFouls += 1;
      break;
    case EventType.SUBSTITUTION:
      break;
  }
}
