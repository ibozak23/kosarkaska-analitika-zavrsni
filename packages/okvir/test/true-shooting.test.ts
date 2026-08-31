import { describe, expect, it } from "vitest";

import { EventType, StatisticsEngine, TrueShootingCalculator } from "../src/index.js";
import type { PlayerContext } from "../src/index.js";
import { dogadaji, igrac7, rezerva, utakmica } from "./kontrolna-utakmica.js";

const kontekst: PlayerContext = { game: utakmica, player: igrac7 };

describe("postotak istinske preciznosti šuta", () => {
  const kalkulator = new TrueShootingCalculator();

  it("nad kontrolnim primjerom vraća 0,615", () => {
    expect(kalkulator.calculate(kontekst, dogadaji)).toBe(0.615);
  });

  it("igrač bez pokušaja vraća null", () => {
    const rezultat = kalkulator.calculate({ game: utakmica, player: rezerva }, dogadaji);

    expect(rezultat).toBeNull();
  });

  it("igraču samo sa slobodnim bacanjima može se izračunati postotak", () => {
    const samoSlobodna = dogadaji.filter(
      (dogadaj) => dogadaj.type !== EventType.SHOT || dogadaj.points === 1
    );

    expect(kalkulator.calculate(kontekst, samoSlobodna)).toBe(0.758);
  });

  it("modul vraća rezultat u imenovanom polju", () => {
    const modul = new StatisticsEngine();
    modul.registerPlayerCalculator(kalkulator);

    const rezultat = modul.calculatePlayerStats(kontekst, dogadaji);

    expect(rezultat.trueShootingPercentage).toBe(0.615);
    expect(rezultat.custom.size).toBe(0);
  });
});
