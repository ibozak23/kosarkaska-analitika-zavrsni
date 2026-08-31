import { Component, ElementRef, computed, signal, viewChild } from "@angular/core";
import type { OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Position } from "@ibozak23/kosarkaska-analitika";
import type { Player, Team } from "@ibozak23/kosarkaska-analitika";

import { ServisSuceljaRest } from "../servisi/servis-sucelja-rest.js";
import { porukaPogreske } from "./poruka-pogreske.js";
import { POZICIJE } from "./oznake.js";

interface ObrazacIgraca {
  firstName: string;
  lastName: string;
  position: Position;
  heightCm: number | null;
  jerseyNumber: number | null;
  teamId: number | null;
}

interface SastavTima {
  readonly tim: Team;
  readonly igraci: readonly Player[];
}

const BEZ_BROJA = Number.MAX_SAFE_INTEGER;

function pripremiPrazanObrazac(teamId: number | null): ObrazacIgraca {
  return {
    firstName: "",
    lastName: "",
    position: Position.PG,
    heightCm: null,
    jerseyNumber: null,
    teamId
  };
}

function pretvoriUObrazac(igrac: Player): ObrazacIgraca {
  return {
    firstName: igrac.firstName,
    lastName: igrac.lastName,
    position: igrac.position,
    heightCm: igrac.heightCm,
    jerseyNumber: igrac.jerseyNumber,
    teamId: igrac.teamId
  };
}

function poredajPoBrojuDresa(lijevi: Player, desni: Player): number {
  return (lijevi.jerseyNumber ?? BEZ_BROJA) - (desni.jerseyNumber ?? BEZ_BROJA)
    || lijevi.lastName.localeCompare(desni.lastName, "hr");
}

@Component({
  selector: "zaslon-igraca",
  imports: [FormsModule],
  templateUrl: "./zaslon-igraca.html"
})
export class ZaslonIgraca implements OnInit {
  protected readonly pozicije = POZICIJE;
  protected readonly igraci = signal<readonly Player[]>([]);
  protected readonly timovi = signal<readonly Team[]>([]);
  protected readonly pogreska = signal<string | null>(null);
  protected readonly pogreskaObrasca = signal<string | null>(null);
  protected readonly oznakaUredjivanog = signal<number | null>(null);
  protected readonly oznakaZaBrisanje = signal<number | null>(null);

  protected readonly oznakaOtvorenogTima = signal<number | null>(null);
  protected obrazac: ObrazacIgraca = pripremiPrazanObrazac(null);

  protected readonly dijalog = viewChild.required<ElementRef<HTMLDialogElement>>("dijalog");

  protected readonly sastavi = computed<readonly SastavTima[]>(() => {
    const igraci = this.igraci();

    return this.timovi()
      .map((tim) => ({
        tim,
        igraci: igraci.filter((igrac) => igrac.teamId === tim.id).sort(poredajPoBrojuDresa)
      }))
      .filter((sastav) => sastav.igraci.length > 0);
  });

  readonly #servis: ServisSuceljaRest;

  constructor(servis: ServisSuceljaRest) {
    this.#servis = servis;
  }

  ngOnInit(): void {
    void this.#dohvatiPodatke();
  }

  protected jeOtvoren(teamId: number): boolean {
    return this.oznakaOtvorenogTima() === teamId;
  }

  protected oznaciTim(teamId: number): void {
    this.oznakaOtvorenogTima.update((otvoreni) => (otvoreni === teamId ? null : teamId));
  }

  protected otvoriUnos(teamId: number | null): void {
    this.oznakaUredjivanog.set(null);
    this.oznakaZaBrisanje.set(null);
    this.pogreskaObrasca.set(null);
    this.obrazac = pripremiPrazanObrazac(teamId ?? this.#dohvatiOznakuPrvogTima());
    this.dijalog().nativeElement.showModal();
  }

  protected otvoriIzmjenu(igrac: Player): void {
    this.oznakaUredjivanog.set(igrac.id);
    this.oznakaZaBrisanje.set(null);
    this.pogreskaObrasca.set(null);
    this.obrazac = pretvoriUObrazac(igrac);
    this.dijalog().nativeElement.showModal();
  }

  protected zatvoriDijalog(): void {
    this.dijalog().nativeElement.close();
  }

  protected naZatvaranjeDijaloga(): void {
    this.oznakaUredjivanog.set(null);
    this.pogreskaObrasca.set(null);
    this.obrazac = pripremiPrazanObrazac(this.#dohvatiOznakuPrvogTima());
  }

  protected zatraziBrisanje(igrac: Player): void {
    this.oznakaZaBrisanje.set(igrac.id);
  }

  protected odustaniOdBrisanja(): void {
    this.oznakaZaBrisanje.set(null);
  }

  protected spremi(): void {
    void this.#spremi();
  }

  protected obrisi(igrac: Player): void {
    void this.#obrisi(igrac);
  }

  async #spremi(): Promise<void> {
    const uredjivani = this.oznakaUredjivanog();
    const teamId = this.obrazac.teamId;

    this.pogreskaObrasca.set(null);

    if (teamId === null) {
      this.pogreskaObrasca.set("Odaberite tim kojem igrač pripada.");

      return;
    }

    const zahtjev = { ...this.obrazac, teamId };

    try {
      if (uredjivani === null) {
        await this.#servis.spremiIgraca(zahtjev);
      } else {
        await this.#servis.izmijeniIgraca(uredjivani, zahtjev);
      }

      this.zatvoriDijalog();
      await this.#dohvatiPodatke();
    } catch (pogreska) {
      this.pogreskaObrasca.set(porukaPogreske(pogreska));
    }
  }

  async #obrisi(igrac: Player): Promise<void> {
    this.pogreska.set(null);
    this.oznakaZaBrisanje.set(null);

    try {
      await this.#servis.obrisiIgraca(igrac.id);
      await this.#dohvatiPodatke();
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }

  async #dohvatiPodatke(): Promise<void> {
    try {
      this.timovi.set(await this.#servis.dohvatiTimove());
      this.igraci.set(await this.#servis.dohvatiIgrace());

      if (this.obrazac.teamId === null) {
        this.obrazac = { ...this.obrazac, teamId: this.#dohvatiOznakuPrvogTima() };
      }
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }

  #dohvatiOznakuPrvogTima(): number | null {
    return this.timovi()[0]?.id ?? null;
  }
}
