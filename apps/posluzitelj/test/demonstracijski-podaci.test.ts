import { beforeAll, describe, expect, it } from "vitest";
import { EventType, GameStatus } from "@ibozak23/kosarkaska-analitika";
import type { Game, Player, Team } from "@ibozak23/kosarkaska-analitika";

import { pripremiServise } from "../src/sastavljanje-servisa.js";
import type { Servisi } from "../src/sastavljanje-servisa.js";
import { U_MEMORIJI, otvoriBazu } from "../src/baza/veza-s-bazom.js";
import { DEMONSTRACIJSKE_LIGASKE_KONSTANTE } from "../src/konfiguracija/ligaske-konstante.js";
import { spremiDemonstracijskePodatke } from "../seed/punjenje.js";
import type { IshodPunjenja } from "../seed/punjenje.js";

const NAJMANJE_DOGADJAJA = 120;

describe("demonstracijski skup podataka", () => {
  let servisi: Servisi;
  let ishod: IshodPunjenja;
  let timovi: Team[];
  let igraci: Player[];
  let utakmica: Game;
  let nastupili: Player[];

  beforeAll(() => {
    servisi = pripremiServise(otvoriBazu(U_MEMORIJI), DEMONSTRACIJSKE_LIGASKE_KONSTANTE);
    ishod = spremiDemonstracijskePodatke(servisi);
    timovi = servisi.maticniPodaci.dohvatiTimove();
    igraci = servisi.maticniPodaci.dohvatiIgrace();
    utakmica = servisi.utakmice.dohvatiUtakmice()[0]!;

    const sDogadjajima = new Set(servisi.utakmice.dohvatiDogadjaje(utakmica.id).map((event) => event.playerId));
    nastupili = igraci.filter((igrac) => sDogadjajima.has(igrac.id));
  });

  it("puni bazu cijelom ligom i jednom završenom utakmicom", () => {
    expect(ishod).toEqual({ brojTimova: 11, brojIgraca: 207, brojUtakmica: 1, brojDogadjaja: 423 });
    expect(timovi).toHaveLength(11);
    expect(igraci).toHaveLength(207);
    expect(servisi.maticniPodaci.dohvatiIgraceTima(utakmica.homeTeamId)).toHaveLength(20);
    expect(servisi.maticniPodaci.dohvatiIgraceTima(utakmica.awayTeamId)).toHaveLength(20);
    expect(utakmica.status).toBe(GameStatus.FINISHED);
  });

  it("svakom klubu daje jedinstvene brojeve dresa", () => {
    for (const tim of timovi) {
      const brojevi = servisi.maticniPodaci
        .dohvatiIgraceTima(tim.id)
        .map((igrac) => igrac.jerseyNumber);

      expect(new Set(brojevi).size, tim.name).toBe(brojevi.length);
    }
  });

  it("zapisuje najmanje 120 događaja, među njima i izmjene igrača", () => {
    const dogadjaji = servisi.utakmice.dohvatiDogadjaje(utakmica.id);

    expect(dogadjaji.length).toBeGreaterThanOrEqual(NAJMANJE_DOGADJAJA);
    expect(dogadjaji.filter((event) => event.type === EventType.SUBSTITUTION)).toHaveLength(80);
    expect(nastupili).toHaveLength(20);
  });

  it("za svakog nastupjelog igrača vraća sva četiri pokazatelja kao brojeve različite od nule", () => {
    for (const igrac of nastupili) {
      const pokazatelji = servisi.analitika.izracunajPokazateljeIgraca(utakmica.id, igrac.id);
      const oznakaIgraca = `${igrac.lastName} ${igrac.firstName}`;

      expect(pokazatelji.boxScore, oznakaIgraca).not.toBeNull();
      expect(pokazatelji.boxScore?.playedSeconds, oznakaIgraca).toBeGreaterThan(0);
      expect(pokazatelji.boxScore?.points, oznakaIgraca).toBeGreaterThan(0);
      expect(pokazatelji.trueShootingPercentage, oznakaIgraca).toBeGreaterThan(0);
      expect(pokazatelji.plusMinus, oznakaIgraca).not.toBe(0);
      expect(pokazatelji.plusMinus, oznakaIgraca).not.toBeNull();
      expect(pokazatelji.playerEfficiencyRating, oznakaIgraca).not.toBe(0);
      expect(pokazatelji.playerEfficiencyRating, oznakaIgraca).not.toBeNull();
    }
  });

  it("za oba tima vraća tempo i oba timska pokazatelja kao brojeve različite od nule", () => {
    for (const teamId of [utakmica.homeTeamId, utakmica.awayTeamId]) {
      const tim = servisi.maticniPodaci.dohvatiTim(teamId);
      const pokazatelji = servisi.analitika.izracunajPokazateljeTima(utakmica.id, teamId);

      expect(pokazatelji.pace, tim.name).toBeGreaterThan(0);
      expect(pokazatelji.offensiveRating, tim.name).toBeGreaterThan(0);
      expect(pokazatelji.defensiveRating, tim.name).toBeGreaterThan(0);
    }
  });

  it("igraču koji nije ušao u igru ne pripisuje pokazatelje", () => {
    const klupa = servisi.maticniPodaci
      .dohvatiIgraceTima(utakmica.homeTeamId)
      .find((igrac) => !nastupili.some((kandidat) => kandidat.id === igrac.id));

    const pokazatelji = servisi.analitika.izracunajPokazateljeIgraca(utakmica.id, klupa!.id);

    expect(pokazatelji.boxScore?.playedSeconds).toBe(0);
    expect(pokazatelji.trueShootingPercentage).toBeNull();
    expect(pokazatelji.plusMinus).toBeNull();
    expect(pokazatelji.playerEfficiencyRating).toBeNull();
  });

  it("daje sažetak utakmice s rezultatom 78:71", () => {
    const sazetak = servisi.analitika.izracunajSazetakUtakmice(utakmica.id);
    const points = (strana: typeof sazetak.home): number =>
      strana.players.reduce((zbroj, redak) => zbroj + (redak.stats.boxScore?.points ?? 0), 0);

    expect(points(sazetak.home)).toBe(78);
    expect(points(sazetak.away)).toBe(71);
    expect(sazetak.home.stats.pace).toBeCloseTo(73.1, 3);
    expect(sazetak.home.stats.offensiveRating).toBeCloseTo(106.791, 3);
    expect(sazetak.home.stats.defensiveRating).toBeCloseTo(97.048, 3);
  });
});
