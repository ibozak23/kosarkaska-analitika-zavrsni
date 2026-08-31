import { describe, expect, it } from "vitest";

import { EventType, PlayerBoxScoreCalculator, PlusMinusCalculator, StatisticsEngine } from "../src/index.js";
import type { PlayerContext } from "../src/index.js";
import { dogadaji, igrac7, rezerva, utakmica } from "./kontrolna-utakmica.js";

const kontekst: PlayerContext = { game: utakmica, player: igrac7 };

describe("pokazatelj pozitivno/negativno", () => {
  const kalkulator = new PlusMinusCalculator();

  it("nad kontrolnim primjerom vraća +3", () => {
    expect(kalkulator.calculate(kontekst, dogadaji)).toBe(3);
  });

  it("slaže se s odigranim vremenom iz istog niza intervala", () => {
    const sazetak = new PlayerBoxScoreCalculator().calculate(kontekst, dogadaji);

    expect(sazetak.playedSeconds).toBe(1740);
  });

  it("igrač koji nije ušao u igru vraća null, a ne pogrešku", () => {
    const rezultat = kalkulator.calculate({ game: utakmica, player: rezerva }, dogadaji);

    expect(rezultat).toBeNull();
  });

  it("igrač na terenu bez ijednog koša vraća nulu, a ne null", () => {
    const bezKoseva = dogadaji.filter((dogadaj) => dogadaj.type !== EventType.SHOT);

    expect(kalkulator.calculate(kontekst, bezKoseva)).toBe(0);
  });

  it("promašaj ne mijenja pokazatelj", () => {
    const bezPromasaja = dogadaji.filter(
      (dogadaj) => dogadaj.type !== EventType.SHOT || dogadaj.made
    );

    expect(kalkulator.calculate(kontekst, bezPromasaja)).toBe(3);
  });

  it("koš postignut dok je igrač izvan terena ne ulazi u pokazatelj", () => {
    const bezKosevaIzvanTerena = dogadaji.filter((dogadaj) => dogadaj.id !== 26 && dogadaj.id !== 28);

    expect(kalkulator.calculate(kontekst, bezKosevaIzvanTerena)).toBe(3);
  });

  it("modul vraća rezultat u imenovanom polju, a ne u mapi custom", () => {
    const modul = new StatisticsEngine();
    modul.registerPlayerCalculator(kalkulator);

    const rezultat = modul.calculatePlayerStats(kontekst, dogadaji);

    expect(rezultat.plusMinus).toBe(3);
    expect(rezultat.custom.size).toBe(0);
  });
});
