import { describe, expect, it } from "vitest";

import { PERCalculator, StatisticsEngine } from "../src/index.js";
import type { LeagueConstants, PlayerContext } from "../src/index.js";
import { dogadaji, igrac7, ligaskeKonstante, rezerva, utakmica } from "./kontrolna-utakmica.js";

const kontekst: PlayerContext = { game: utakmica, player: igrac7 };

describe("neprilagođeni indeks učinkovitosti igrača", () => {
  const kalkulator = new PERCalculator(ligaskeKonstante);

  it("nad kontrolnim primjerom vraća 0,235", () => {
    expect(kalkulator.calculate(kontekst, dogadaji)).toBe(0.235);
  });

  it("isti niz događaja uz druge ligaške konstante daje drukčiji rezultat", () => {
    const drugaLiga: LeagueConstants = {
      ...ligaskeKonstante,
      points: 95,
      fieldGoalsMade: 34,
      fieldGoalsAttempted: 72,
      assists: 21,
      totalRebounds: 44
    };

    const prvi = kalkulator.calculate(kontekst, dogadaji);
    const drugi = new PERCalculator(drugaLiga).calculate(kontekst, dogadaji);

    expect(prvi).not.toBeNull();
    expect(drugi).not.toBeNull();
    expect(drugi).not.toBe(prvi);
  });

  it("igrač koji nije ušao u igru vraća null", () => {
    expect(kalkulator.calculate({ game: utakmica, player: rezerva }, dogadaji)).toBeNull();
  });

  it("ligaška konstanta koja nije pozitivna prekida stvaranje kalkulatora", () => {
    const bezSkokova: LeagueConstants = { ...ligaskeKonstante, totalRebounds: 0 };

    expect(() => new PERCalculator(bezSkokova)).toThrow();
  });

  it("modul vraća rezultat u imenovanom polju", () => {
    const modul = new StatisticsEngine();
    modul.registerPlayerCalculator(kalkulator);

    const rezultat = modul.calculatePlayerStats(kontekst, dogadaji);

    expect(rezultat.playerEfficiencyRating).toBe(0.235);
    expect(rezultat.custom.size).toBe(0);
  });
});
