import { Component, ElementRef, signal, viewChild } from "@angular/core";
import type { OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { GameStatus } from "@ibozak23/kosarkaska-analitika";
import type { Player, Team } from "@ibozak23/kosarkaska-analitika";

import { ServisSuceljaRest } from "../servisi/servis-sucelja-rest.js";
import type { OdgovorSazetkaTima, OdgovorUtakmice } from "../servisi/tipovi-sucelja-rest.js";
import { porukaPogreske } from "./poruka-pogreske.js";
import { oblikujDatumIVrijeme, oblikujSadasnjiTrenutakZaObrazac } from "./oblikovanje.js";
import { oznakaStanja } from "./oznake.js";

interface ObrazacUtakmice {
  playedAt: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
}

interface Rezultat {
  readonly home: number;
  readonly away: number;
}

@Component({
  selector: "zaslon-utakmica",
  imports: [FormsModule, RouterLink],
  templateUrl: "./zaslon-utakmica.html"
})
export class ZaslonUtakmica implements OnInit {
  protected readonly utakmice = signal<readonly OdgovorUtakmice[]>([]);

  protected readonly rezultati = signal<ReadonlyMap<number, Rezultat>>(new Map());
  protected readonly timovi = signal<readonly Team[]>([]);

  protected readonly domaciIgraci = signal<readonly Player[]>([]);
  protected readonly gostujuciIgraci = signal<readonly Player[]>([]);

  protected readonly domacaPetorka = signal<readonly number[]>([]);
  protected readonly gostujucaPetorka = signal<readonly number[]>([]);
  protected readonly pogreska = signal<string | null>(null);
  protected readonly pogreskaObrasca = signal<string | null>(null);
  protected obrazac: ObrazacUtakmice = {
    playedAt: oblikujSadasnjiTrenutakZaObrazac(),
    homeTeamId: null,
    awayTeamId: null
  };

  protected readonly oblikujDatumIVrijeme = oblikujDatumIVrijeme;

  protected readonly dijalog = viewChild.required<ElementRef<HTMLDialogElement>>("dijalog");

  readonly #servis: ServisSuceljaRest;

  constructor(servis: ServisSuceljaRest) {
    this.#servis = servis;
  }

  ngOnInit(): void {
    void this.#dohvatiPodatke();
  }

  protected imeTima(teamId: number): string {
    return this.timovi().find((tim) => tim.id === teamId)?.name ?? "—";
  }

  protected oznakaStanjaUtakmice(utakmica: OdgovorUtakmice): string {
    return oznakaStanja(utakmica.status);
  }

  protected jeUTijeku(utakmica: OdgovorUtakmice): boolean {
    return utakmica.status === GameStatus.IN_PROGRESS;
  }

  protected rezultatUtakmice(utakmica: OdgovorUtakmice): string {
    const rezultat = this.rezultati().get(utakmica.id);

    return rezultat === undefined ? "—" : `${rezultat.home} : ${rezultat.away}`;
  }

  protected otvoriUnos(): void {
    this.pogreskaObrasca.set(null);
    this.obrazac = {
      playedAt: oblikujSadasnjiTrenutakZaObrazac(),
      homeTeamId: null,
      awayTeamId: null
    };
    this.naPromjenuTima();
    this.dijalog().nativeElement.showModal();
  }

  protected zatvoriDijalog(): void {
    this.dijalog().nativeElement.close();
  }

  protected naZatvaranjeDijaloga(): void {
    this.pogreskaObrasca.set(null);
  }

  protected naPromjenuTima(): void {
    this.domacaPetorka.set([]);
    this.gostujucaPetorka.set([]);
    void this.#dohvatiSastave();
  }

  protected oznaciDomaceg(playerId: number): void {
    this.domacaPetorka.update((odabrani) => izmijeniOznakuUNizu(odabrani, playerId));
  }

  protected oznaciGostujuceg(playerId: number): void {
    this.gostujucaPetorka.update((odabrani) => izmijeniOznakuUNizu(odabrani, playerId));
  }

  protected prijavi(): void {
    void this.#prijavi();
  }

  protected zavrsi(utakmica: OdgovorUtakmice): void {
    void this.#zavrsi(utakmica);
  }

  async #prijavi(): Promise<void> {
    const homeTeamId = this.obrazac.homeTeamId;
    const awayTeamId = this.obrazac.awayTeamId;

    this.pogreskaObrasca.set(null);

    if (homeTeamId === null || awayTeamId === null) {
      this.pogreskaObrasca.set("Odaberite domaći i gostujući tim.");

      return;
    }

    try {
      await this.#servis.spremiPrijavuUtakmice({
        playedAt: this.obrazac.playedAt,
        homeTeamId,
        awayTeamId,
        homeStarters: this.domacaPetorka(),
        awayStarters: this.gostujucaPetorka()
      });

      this.obrazac = {
        playedAt: oblikujSadasnjiTrenutakZaObrazac(),
        homeTeamId: null,
        awayTeamId: null
      };
      this.naPromjenuTima();
      this.zatvoriDijalog();
      await this.#dohvatiPodatke();
    } catch (pogreska) {
      this.pogreskaObrasca.set(porukaPogreske(pogreska));
    }
  }

  async #zavrsi(utakmica: OdgovorUtakmice): Promise<void> {
    this.pogreska.set(null);

    try {
      await this.#servis.izmijeniUtakmicuUZavrsenu(utakmica.id);
      await this.#dohvatiPodatke();
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }

  async #dohvatiPodatke(): Promise<void> {
    try {
      this.timovi.set(await this.#servis.dohvatiTimove());

      const utakmice = await this.#servis.dohvatiUtakmice();

      this.utakmice.set(utakmice);
      await this.#dohvatiRezultate(utakmice);
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }

  async #dohvatiRezultate(utakmice: readonly OdgovorUtakmice[]): Promise<void> {
    const zapocete = utakmice.filter((utakmica) => utakmica.status !== GameStatus.SCHEDULED);
    const zapisi = await Promise.all(
      zapocete.map(async (utakmica) => {
        const sazetak = await this.#servis.dohvatiSazetakUtakmice(utakmica.id);

        return [
          utakmica.id,
          { home: zbrojPoena(sazetak.home), away: zbrojPoena(sazetak.away) }
        ] as const;
      })
    );

    this.rezultati.set(new Map(zapisi));
  }

  async #dohvatiSastave(): Promise<void> {
    const { homeTeamId, awayTeamId } = this.obrazac;

    try {
      this.domaciIgraci.set(homeTeamId === null ? [] : await this.#servis.dohvatiIgraceTima(homeTeamId));
      this.gostujuciIgraci.set(awayTeamId === null ? [] : await this.#servis.dohvatiIgraceTima(awayTeamId));
    } catch (pogreska) {
      this.pogreskaObrasca.set(porukaPogreske(pogreska));
    }
  }
}

function izmijeniOznakuUNizu(odabrani: readonly number[], playerId: number): readonly number[] {
  return odabrani.includes(playerId)
    ? odabrani.filter((kandidat) => kandidat !== playerId)
    : [...odabrani, playerId];
}

function zbrojPoena(sazetak: OdgovorSazetkaTima): number {
  let poeni = 0;

  for (const redak of sazetak.players) {
    if (redak.stats.boxScore !== null) {
      poeni += redak.stats.boxScore.points;
    }
  }

  return poeni;
}
