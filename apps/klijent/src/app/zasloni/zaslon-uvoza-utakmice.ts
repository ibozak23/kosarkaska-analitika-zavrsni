import { Component, ElementRef, computed, signal, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";
import { EventType } from "@ibozak23/kosarkaska-analitika";

import { ServisSuceljaRest } from "../servisi/servis-sucelja-rest.js";
import type { OdgovorUvozaUtakmice } from "../servisi/tipovi-sucelja-rest.js";
import { procitajUtakmicu } from "../uvoz/citanje-utakmice.js";
import { provjeriUtakmicu } from "../uvoz/provjera-uvoza.js";
import { sastaviZahtjevUvoza } from "../uvoz/sastavljanje-zahtjeva.js";
import { STRANE_UTAKMICE } from "../uvoz/model-uvoza.js";
import type { PogreskaUvoza, StranaUtakmice, UvezenaUtakmica, UvezeniDogadjaj } from "../uvoz/model-uvoza.js";
import { oblikujVrijemeSemafora } from "./oblikovanje.js";
import { BODOVI_SUTA, SMJEROVI_IZMJENE, VRSTE_DOGADJAJA } from "./oznake.js";
import { porukaPogreske } from "./poruka-pogreske.js";

interface SazetakStrane {
  readonly oznaka: string;
  readonly naziv: string;
  readonly brojIgraca: number;
  readonly petorka: string;
}

interface BrojPoVrsti {
  readonly oznaka: string;
  readonly broj: number;
}

const VIDLJIVIH_REDAKA_PREGLEDA = 12;

function oznakaStrane(strana: StranaUtakmice): string {
  return strana === "DOMACI" ? "Domaći" : "Gosti";
}

@Component({
  selector: "zaslon-uvoza-utakmice",
  imports: [RouterLink],
  templateUrl: "./zaslon-uvoza-utakmice.html"
})
export class ZaslonUvozaUtakmice {
  protected readonly nazivDatoteke = signal<string | null>(null);
  protected readonly utakmica = signal<UvezenaUtakmica | null>(null);
  protected readonly pogreskeDatoteke = signal<readonly PogreskaUvoza[]>([]);
  protected readonly pogreska = signal<string | null>(null);
  protected readonly uvozUTijeku = signal(false);
  protected readonly ishod = signal<OdgovorUvozaUtakmice | null>(null);

  protected readonly vidljivihRedaka = VIDLJIVIH_REDAKA_PREGLEDA;
  protected readonly oblikujVrijemeSemafora = oblikujVrijemeSemafora;

  protected readonly poljeDatoteke = viewChild.required<ElementRef<HTMLInputElement>>("poljeDatoteke");

  protected readonly sazetakStrana = computed<readonly SazetakStrane[]>(() => {
    const procitana = this.utakmica();

    if (procitana === null) {
      return [];
    }

    return STRANE_UTAKMICE.map((strana) => ({
      oznaka: oznakaStrane(strana),
      naziv: procitana.timovi.find((tim) => tim.strana === strana)?.naziv ?? "—",
      brojIgraca: procitana.igraci.filter((igrac) => igrac.strana === strana).length,
      petorka: (procitana.petorke.find((petorka) => petorka.strana === strana)?.dresovi ?? [])
        .map((dres) => String(dres))
        .join(", ")
    }));
  });

  protected readonly brojeviPoVrsti = computed<readonly BrojPoVrsti[]>(() => {
    const dogadjaji = this.utakmica()?.dogadjaji ?? [];

    return VRSTE_DOGADJAJA.map((izbor) => ({
      oznaka: izbor.oznaka,
      broj: dogadjaji.filter((dogadjaj) => dogadjaj.tip === izbor.vrijednost).length
    })).filter((redak) => redak.broj > 0);
  });

  readonly #servis: ServisSuceljaRest;

  constructor(servis: ServisSuceljaRest) {
    this.#servis = servis;
  }

  protected naOdabirDatoteke(): void {
    const datoteka = this.poljeDatoteke().nativeElement.files?.[0];

    if (datoteka === undefined) {
      return;
    }

    void this.#procitaj(datoteka);
  }

  protected uvezi(): void {
    const procitana = this.utakmica();

    if (procitana === null) {
      return;
    }

    void this.#posalji(procitana);
  }

  protected zapocniIznova(): void {
    this.poljeDatoteke().nativeElement.value = "";
    this.nazivDatoteke.set(null);
    this.utakmica.set(null);
    this.pogreskeDatoteke.set([]);
    this.pogreska.set(null);
    this.ishod.set(null);
  }

  protected oznakaVrste(tip: EventType): string {
    return VRSTE_DOGADJAJA.find((izbor) => izbor.vrijednost === tip)?.oznaka ?? tip;
  }

  protected oznakaStraneDogadjaja(dogadjaj: UvezeniDogadjaj): string {
    return oznakaStrane(dogadjaj.strana);
  }

  protected pojedinost(dogadjaj: UvezeniDogadjaj): string {
    if (dogadjaj.tip === EventType.SHOT) {
      const vrsta = BODOVI_SUTA.find((izbor) => izbor.vrijednost === dogadjaj.poeni)?.oznaka ?? "";

      return `${vrsta} — ${dogadjaj.pogodak ? "pogođen" : "promašen"}`;
    }

    if (dogadjaj.tip === EventType.SUBSTITUTION) {
      return SMJEROVI_IZMJENE.find((izbor) => izbor.vrijednost === dogadjaj.smjer)?.oznaka ?? "";
    }

    return "—";
  }

  async #procitaj(datoteka: File): Promise<void> {
    this.utakmica.set(null);
    this.pogreskeDatoteke.set([]);
    this.pogreska.set(null);
    this.ishod.set(null);
    this.nazivDatoteke.set(datoteka.name);

    try {
      const procitano = procitajUtakmicu(await datoteka.text());
      const pogreske = [...procitano.pogreske, ...provjeriUtakmicu(procitano.utakmica)];

      this.pogreskeDatoteke.set(pogreske);

      if (pogreske.length === 0) {
        this.utakmica.set(procitano.utakmica);
      }
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }

  async #posalji(procitana: UvezenaUtakmica): Promise<void> {
    this.uvozUTijeku.set(true);
    this.pogreska.set(null);

    try {
      const ishod = await this.#servis.uveziUtakmicu(sastaviZahtjevUvoza(procitana));

      this.ishod.set(ishod);
      this.utakmica.set(null);
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    } finally {
      this.uvozUTijeku.set(false);
    }
  }
}
