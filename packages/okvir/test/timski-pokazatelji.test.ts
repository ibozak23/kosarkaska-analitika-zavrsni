import { describe, expect, it } from "vitest";

import { DefensiveRatingCalculator, OffensiveRatingCalculator, PaceCalculator, StatisticsEngine} from "../src/index.js";
import type { TeamContext } from "../src/index.js";
import { dogadaji, domaciTim, gostujuciTim, utakmica } from "./kontrolna-utakmica.js";

const kontekstDomacih: TeamContext = { game: utakmica, team: domaciTim };
const kontekstGostiju: TeamContext = { game: utakmica, team: gostujuciTim };

function statistikaTima(kontekst: TeamContext) {
  const modul = new StatisticsEngine();
  modul.registerTeamCalculator(new PaceCalculator());
  modul.registerTeamCalculator(new OffensiveRatingCalculator());
  modul.registerTeamCalculator(new DefensiveRatingCalculator());

  return modul.calculateTeamStats(kontekst, dogadaji);
}

describe("timski pokazatelji", () => {
  const domaci = statistikaTima(kontekstDomacih);
  const gosti = statistikaTima(kontekstGostiju);

  it("tempo utakmice iznosi 11,600 za oba tima", () => {
    expect(domaci.pace).toBe(11.6);
    expect(gosti.pace).toBe(11.6);
  });

  it("ofenzivni pokazatelj domaćih iznosi 114,841, gostiju 84,175", () => {
    expect(domaci.offensiveRating).toBe(114.841);
    expect(gosti.offensiveRating).toBe(84.175);
  });

  it("defenzivni pokazatelj jednog tima jednak je ofenzivnom drugoga", () => {
    expect(domaci.defensiveRating).toBe(gosti.offensiveRating);
    expect(gosti.defensiveRating).toBe(domaci.offensiveRating);
  });

  it("broj posjeda oba timova razlikuje se za manje od dva posjeda", () => {
    const posjediDomacih = (13 / (domaci.offensiveRating ?? 0)) * 100;
    const posjediGostiju = (10 / (domaci.defensiveRating ?? 0)) * 100;

    expect(posjediDomacih).toBeCloseTo(11.32, 3);
    expect(posjediGostiju).toBeCloseTo(11.88, 3);
    expect(Math.abs(posjediDomacih - posjediGostiju)).toBeLessThan(2);
  });

  it("utakmica bez ijednog događaja vraća null umjesto broja", () => {
    const modul = new StatisticsEngine();
    modul.registerTeamCalculator(new PaceCalculator());
    modul.registerTeamCalculator(new OffensiveRatingCalculator());
    modul.registerTeamCalculator(new DefensiveRatingCalculator());

    const rezultat = modul.calculateTeamStats(kontekstDomacih, []);

    expect(rezultat.pace).toBeNull();
    expect(rezultat.offensiveRating).toBeNull();
    expect(rezultat.defensiveRating).toBeNull();
  });
});
