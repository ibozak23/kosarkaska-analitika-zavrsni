import { Component, ElementRef, signal, viewChild } from "@angular/core";
import type { OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { Team } from "@ibozak23/kosarkaska-analitika";

import { ServisSuceljaRest } from "../servisi/servis-sucelja-rest.js";
import { porukaPogreske } from "./poruka-pogreske.js";

interface ObrazacTima {
  name: string;
  city: string;
  league: string;
  season: string;
}

function pripremiPrazanObrazac(): ObrazacTima {
  return { name: "", city: "", league: "", season: "" };
}

function pretvoriUObrazac(tim: Team): ObrazacTima {
  return {
    name: tim.name,
    city: tim.city ?? "",
    league: tim.league ?? "",
    season: tim.season ?? ""
  };
}

@Component({
  selector: "zaslon-timova",
  imports: [FormsModule],
  templateUrl: "./zaslon-timova.html"
})

export class ZaslonTimova implements OnInit {

  protected readonly timovi = signal<readonly Team[]>([]);

  protected readonly pogreska = signal<string | null>(null);
  protected readonly pogreskaObrasca = signal<string | null>(null);

  protected readonly oznakaUredjivanog = signal<number | null>(null);

  protected readonly oznakaZaBrisanje = signal<number | null>(null);

  protected obrazac: ObrazacTima = pripremiPrazanObrazac();

  protected readonly dijalog = viewChild.required<ElementRef<HTMLDialogElement>>("dijalog");

  readonly #servis: ServisSuceljaRest;

  constructor(servis: ServisSuceljaRest) {
    this.#servis = servis;
  }

  ngOnInit(): void {
    void this.#dohvatiPodatke();
  }

  protected otvoriUnos(): void {
    this.oznakaUredjivanog.set(null);
    this.oznakaZaBrisanje.set(null);
    this.pogreskaObrasca.set(null);
    this.obrazac = pripremiPrazanObrazac();
    this.dijalog().nativeElement.showModal();
  }

  protected otvoriIzmjenu(tim: Team): void {
    this.oznakaUredjivanog.set(tim.id);
    this.oznakaZaBrisanje.set(null);
    this.pogreskaObrasca.set(null);
    this.obrazac = pretvoriUObrazac(tim);
    this.dijalog().nativeElement.showModal();
  }

  protected zatvoriDijalog(): void {
    this.dijalog().nativeElement.close();
  }

  protected naZatvaranjeDijaloga(): void {
    this.oznakaUredjivanog.set(null);
    this.pogreskaObrasca.set(null);
    this.obrazac = pripremiPrazanObrazac();
  }

  protected zatraziBrisanje(tim: Team): void {
    this.oznakaZaBrisanje.set(tim.id);
  }

  protected odustaniOdBrisanja(): void {
    this.oznakaZaBrisanje.set(null);
  }

  protected spremi(): void {
    void this.#spremi();
  }

  protected obrisi(tim: Team): void {
    void this.#obrisi(tim);
  }

  async #spremi(): Promise<void> {
    const uredjivani = this.oznakaUredjivanog();

    this.pogreskaObrasca.set(null);

    try {
      if (uredjivani === null) {
        await this.#servis.spremiTim(this.obrazac);
      } else {
        await this.#servis.izmijeniTim(uredjivani, this.obrazac);
      }

      this.zatvoriDijalog();
      await this.#dohvatiPodatke();
    } catch (pogreska) {
      this.pogreskaObrasca.set(porukaPogreske(pogreska));
    }
  }

  async #obrisi(tim: Team): Promise<void> {
    this.pogreska.set(null);
    this.oznakaZaBrisanje.set(null);

    try {
      await this.#servis.obrisiTim(tim.id);
      await this.#dohvatiPodatke();
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }

  async #dohvatiPodatke(): Promise<void> {
    try {
      this.timovi.set(await this.#servis.dohvatiTimove());
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }
}
