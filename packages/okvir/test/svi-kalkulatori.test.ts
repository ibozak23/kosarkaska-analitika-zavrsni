import { describe, expect, it } from "vitest";

import { DefensiveRatingCalculator, OffensiveRatingCalculator, PaceCalculator, PERCalculator, PlayerBoxScoreCalculator, PlusMinusCalculator, StatisticsEngine, TrueShootingCalculator } from "../src/index.js";
import type { PlayerContext, StatisticCalculator, TeamContext } from "../src/index.js";
import { dogadaji, domaciTim, igrac7, ligaskeKonstante, utakmica } from "./kontrolna-utakmica.js";

function modulSaSvimKalkulatorima(): StatisticsEngine {
  const modul = new StatisticsEngine();

  modul.registerPlayerCalculator(new PlayerBoxScoreCalculator());
  modul.registerPlayerCalculator(new TrueShootingCalculator());
  modul.registerPlayerCalculator(new PlusMinusCalculator());
  modul.registerPlayerCalculator(new PERCalculator(ligaskeKonstante));
  modul.registerTeamCalculator(new PaceCalculator());
  modul.registerTeamCalculator(new OffensiveRatingCalculator());
  modul.registerTeamCalculator(new DefensiveRatingCalculator());

  return modul;
}

const kontekstIgraca: PlayerContext = { game: utakmica, player: igrac7 };
const kontekstTima: TeamContext = { game: utakmica, team: domaciTim };

describe("svih sedam pokazatelja kroz analitički modul", () => {
  const modul = modulSaSvimKalkulatorima();
  const igrac = modul.calculatePlayerStats(kontekstIgraca, dogadaji);
  const tim = modul.calculateTeamStats(kontekstTima, dogadaji);

  it("jedan poziv vraća sva četiri pokazatelja igrača", () => {
    expect(igrac.boxScore?.points).toBe(9);
    expect(igrac.boxScore?.playedSeconds).toBe(1740);
    expect(igrac.trueShootingPercentage).toBe(0.615);
    expect(igrac.plusMinus).toBe(3);
    expect(igrac.playerEfficiencyRating).toBe(0.235);
  });

  it("jedan poziv vraća sva tri timska pokazatelja", () => {
    expect(tim.pace).toBe(11.6);
    expect(tim.offensiveRating).toBe(114.841);
    expect(tim.defensiveRating).toBe(84.175);
  });

  it("ugrađeni kalkulatori ne ostavljaju ništa u mapi custom", () => {
    expect(igrac.custom.size).toBe(0);
    expect(tim.custom.size).toBe(0);
  });

  it("vanjski kalkulator radi uz svih sedam ugrađenih", () => {
    const brojacDogadaja: StatisticCalculator<PlayerContext, number> = {
      name: "brojDogadaja",
      calculate: (kontekst, sviDogadaji) =>
        sviDogadaji.filter((dogadaj) => dogadaj.playerId === kontekst.player.id).length
    };

    const prosireni = modulSaSvimKalkulatorima();
    prosireni.registerPlayerCalculator(brojacDogadaja);

    const rezultat = prosireni.calculatePlayerStats(kontekstIgraca, dogadaji);

    expect(rezultat.playerEfficiencyRating).toBe(0.235);
    expect(rezultat.custom.get("brojDogadaja")).toBe(26);
  });

  it("nijedan pokazatelj ne vraća NaN ni Infinity", () => {
    const vrijednosti = [
      igrac.trueShootingPercentage,
      igrac.plusMinus,
      igrac.playerEfficiencyRating,
      tim.pace,
      tim.offensiveRating,
      tim.defensiveRating
    ];

    for (const vrijednost of vrijednosti) {
      expect(vrijednost === null || Number.isFinite(vrijednost)).toBe(true);
    }
  });
});
