import { describe, expect, it } from "vitest";

import { EventType, SubstitutionDirection } from "../src/index.js";
import type { GameEvent } from "../src/index.js";

const osnova = {
  gameId: 1,
  playerId: 7,
  teamId: 1,
  quarter: 1,
  minute: 7,
  second: 46
};

function opis(dogadaj: GameEvent): string {
  switch (dogadaj.type) {
    case EventType.SHOT:
      return `šut za ${dogadaj.points}, ${dogadaj.made ? "pogođen" : "promašen"}`;
    case EventType.ASSIST:
      return "asistencija";
    case EventType.REBOUND_OFF:
      return "ofenzivni skok";
    case EventType.REBOUND_DEF:
      return "defenzivni skok";
    case EventType.FOUL:
      return "faul";
    case EventType.TURNOVER:
      return "izgubljena lopta";
    case EventType.BLOCK:
      return "blokada";
    case EventType.STEAL:
      return "ukradena lopta";
    case EventType.SUBSTITUTION:
      return dogadaj.direction === SubstitutionDirection.IN ? "ulazak" : "izlazak";
    default: {
      const neobradenTip: never = dogadaj;
      return neobradenTip;
    }
  }
}

const primjeri: ReadonlyArray<{ readonly dogadaj: GameEvent; readonly ocekivano: string }> = [
  { dogadaj: { ...osnova, id: 1, type: EventType.SHOT, points: 3, made: true }, ocekivano: "šut za 3, pogođen" },
  { dogadaj: { ...osnova, id: 2, type: EventType.SHOT, points: 2, made: false }, ocekivano: "šut za 2, promašen" },
  { dogadaj: { ...osnova, id: 3, type: EventType.ASSIST }, ocekivano: "asistencija" },
  { dogadaj: { ...osnova, id: 4, type: EventType.REBOUND_OFF }, ocekivano: "ofenzivni skok" },
  { dogadaj: { ...osnova, id: 5, type: EventType.REBOUND_DEF }, ocekivano: "defenzivni skok" },
  { dogadaj: { ...osnova, id: 6, type: EventType.FOUL }, ocekivano: "faul" },
  { dogadaj: { ...osnova, id: 7, type: EventType.TURNOVER }, ocekivano: "izgubljena lopta" },
  { dogadaj: { ...osnova, id: 8, type: EventType.BLOCK }, ocekivano: "blokada" },
  { dogadaj: { ...osnova, id: 9, type: EventType.STEAL }, ocekivano: "ukradena lopta" },
  {
    dogadaj: { ...osnova, id: 10, type: EventType.SUBSTITUTION, direction: SubstitutionDirection.IN },
    ocekivano: "ulazak"
  },
  {
    dogadaj: { ...osnova, id: 11, type: EventType.SUBSTITUTION, direction: SubstitutionDirection.OUT },
    ocekivano: "izlazak"
  }
];

describe("hijerarhija događaja", () => {
  it("svaka vrsta događaja prepoznaje se u switch", () => {
    for (const { dogadaj, ocekivano } of primjeri) {
      expect(opis(dogadaj)).toBe(ocekivano);
    }
  });

  it("primjeri pokrivaju devet vrsta događaja", () => {
    const vrste = new Set(primjeri.map(({ dogadaj }) => dogadaj.type));

    expect(vrste.size).toBe(Object.values(EventType).length);
  });

  it("vrste događaja jednake su oznakama u bazi", () => {
    expect(Object.values(EventType)).toEqual([
      "SHOT",
      "ASSIST",
      "REBOUND_OFF",
      "REBOUND_DEF",
      "FOUL",
      "TURNOVER",
      "BLOCK",
      "STEAL",
      "SUBSTITUTION"
    ]);
    expect(Object.values(SubstitutionDirection)).toEqual(["IN", "OUT"]);
  });
});
