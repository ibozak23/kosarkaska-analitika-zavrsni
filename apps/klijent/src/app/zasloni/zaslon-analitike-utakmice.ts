import { Component, signal } from "@angular/core";
import type { OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";

import { ServisSuceljaRest } from "../servisi/servis-sucelja-rest.js";
import type {
  OdgovorSazetkaUtakmice,
  OdgovorPokazateljaIgraca,
  OdgovorPokazateljaTima,
  OdgovorSazetkaTima
} from "../servisi/tipovi-sucelja-rest.js";
import { porukaPogreske } from "./poruka-pogreske.js";
import {
  oblikujDecimalniBroj,
  oblikujOdigranoVrijeme,
  oblikujPogodjeneOdPokusanih,
  oblikujPostotak
} from "./oblikovanje.js";

interface Zbrojevi {
  points: number;
  fieldGoalsMade: number;
  fieldGoalsAttempted: number;
  threePointersMade: number;
  threePointersAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  personalFouls: number;
}

const VIDLJIVIH_REDAKA_IGRACA = 10;

function izracunajZbrojZapisnika(sazetak: OdgovorSazetkaTima): Zbrojevi {
  const zbrojevi: Zbrojevi = {
    points: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
    freeThrowsMade: 0,
    freeThrowsAttempted: 0,
    offensiveRebounds: 0,
    defensiveRebounds: 0,
    assists: 0,
    turnovers: 0,
    steals: 0,
    blocks: 0,
    personalFouls: 0
  };

  for (const redak of sazetak.players) {

    const zapisnik = redak.stats.boxScore;

    if (zapisnik === null) {
      continue;
    }

    zbrojevi.points += zapisnik.points;
    zbrojevi.fieldGoalsMade += zapisnik.fieldGoalsMade;
    zbrojevi.fieldGoalsAttempted += zapisnik.fieldGoalsAttempted;
    zbrojevi.threePointersMade += zapisnik.threePointersMade;
    zbrojevi.threePointersAttempted += zapisnik.threePointersAttempted;
    zbrojevi.freeThrowsMade += zapisnik.freeThrowsMade;
    zbrojevi.freeThrowsAttempted += zapisnik.freeThrowsAttempted;
    zbrojevi.offensiveRebounds += zapisnik.offensiveRebounds;
    zbrojevi.defensiveRebounds += zapisnik.defensiveRebounds;
    zbrojevi.assists += zapisnik.assists;
    zbrojevi.turnovers += zapisnik.turnovers;
    zbrojevi.steals += zapisnik.steals;
    zbrojevi.blocks += zapisnik.blocks;
    zbrojevi.personalFouls += zapisnik.personalFouls;
  }

  return zbrojevi;
}

@Component({
  selector: "zaslon-analitike-utakmice",
  imports: [RouterLink],
  templateUrl: "./zaslon-analitike-utakmice.html"
})
export class ZaslonAnalitikeUtakmice implements OnInit {

  protected readonly oblikujDecimalniBroj = oblikujDecimalniBroj;
  protected readonly oblikujPostotak = oblikujPostotak;
  protected readonly oblikujOdigranoVrijeme = oblikujOdigranoVrijeme;
  protected readonly oblikujPogodjeneOdPokusanih = oblikujPogodjeneOdPokusanih;
  protected readonly izracunajZbrojZapisnika = izracunajZbrojZapisnika;

  protected readonly vidljivihRedaka = VIDLJIVIH_REDAKA_IGRACA + 1;

  protected readonly sazetak = signal<OdgovorSazetkaUtakmice | null>(null);

  protected readonly pokazateljiTimova = signal<readonly OdgovorPokazateljaTima[]>([]);

  protected readonly pokazateljiIgraca = signal<OdgovorPokazateljaIgraca | null>(null);
  protected readonly pogreska = signal<string | null>(null);
  protected readonly oznakaOdabranogIgraca = signal<number | null>(null);

  readonly #servis: ServisSuceljaRest;
  readonly #oznakaUtakmice: number;

  constructor(servis: ServisSuceljaRest, putanja: ActivatedRoute) {
    this.#servis = servis;
    this.#oznakaUtakmice = Number(putanja.snapshot.paramMap.get("id"));
  }

  ngOnInit(): void {
    void this.#dohvatiPodatke();
  }

  protected sadrziOdabranog(strana: OdgovorSazetkaTima): boolean {
    const playerId = this.oznakaOdabranogIgraca();

    return playerId !== null && strana.players.some((redak) => redak.player.id === playerId);
  }

  protected pokazateljiTima(teamId: number): OdgovorPokazateljaTima | null {
    return this.pokazateljiTimova().find((pokazatelji) => pokazatelji.teamId === teamId) ?? null;
  }

  protected imeIgraca(playerId: number | null): string {
    const trenutniSazetak = this.sazetak();

    if (trenutniSazetak === null || playerId === null) {
      return "—";
    }

    for (const strana of [trenutniSazetak.home, trenutniSazetak.away]) {
      const redak = strana.players.find((kandidat) => kandidat.player.id === playerId);

      if (redak !== undefined) {
        return `${redak.player.firstName} ${redak.player.lastName}`;
      }
    }

    return "—";
  }

  protected odaberiIgraca(playerId: number): void {
    this.oznakaOdabranogIgraca.set(this.oznakaOdabranogIgraca() === playerId ? null : playerId);
    void this.#dohvatiPokazateljeOdabranog();
  }

  async #dohvatiPokazateljeOdabranog(): Promise<void> {
    const playerId = this.oznakaOdabranogIgraca();

    this.pogreska.set(null);
    this.pokazateljiIgraca.set(null);

    if (playerId === null) {
      return;
    }

    try {
      this.pokazateljiIgraca.set(
        await this.#servis.dohvatiPokazateljeIgraca(this.#oznakaUtakmice, playerId)
      );
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }

  async #dohvatiPodatke(): Promise<void> {
    try {
      const sazetak = await this.#servis.dohvatiSazetakUtakmice(this.#oznakaUtakmice);

      this.sazetak.set(sazetak);
      this.pokazateljiTimova.set([
        await this.#servis.dohvatiPokazateljeTima(this.#oznakaUtakmice, sazetak.home.team.id),
        await this.#servis.dohvatiPokazateljeTima(this.#oznakaUtakmice, sazetak.away.team.id)
      ]);
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }
}
