import { Component, ElementRef, signal, viewChild } from "@angular/core";
import type { OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { EventType, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";
import type { GameEvent, Player, Team } from "@ibozak23/kosarkaska-analitika";

import { ServisSuceljaRest } from "../servisi/servis-sucelja-rest.js";
import type { ZahtjevZaDogadjaj, OdgovorUtakmice } from "../servisi/tipovi-sucelja-rest.js";
import { porukaPogreske } from "./poruka-pogreske.js";
import { oblikujVrijemeSemafora } from "./oblikovanje.js";
import { SMJEROVI_IZMJENE, VRSTE_DOGADJAJA, BODOVI_SUTA, opisDogadjaja } from "./oznake.js";

interface SastavTima {
  readonly tim: Team;
  readonly igraci: readonly Player[];
}

interface ObrazacDogadjaja {
  type: EventType;
  playerId: number | null;
  quarter: number | null;
  minute: number | null;
  second: number | null;
  points: 1 | 2 | 3;
  made: boolean;
  direction: SubstitutionDirection;
}

const VIDLJIVIH_REDAKA_DOGADJAJA = 15;

function pripremiPrazanObrazac(): ObrazacDogadjaja {
  return {
    type: EventType.SHOT,
    playerId: null,
    quarter: 1,
    minute: 10,
    second: 0,
    points: 2,
    made: true,
    direction: SubstitutionDirection.IN
  };
}

@Component({
  selector: "zaslon-dogadjaja-utakmice",
  imports: [FormsModule, RouterLink],
  templateUrl: "./zaslon-dogadjaja-utakmice.html"
})
export class ZaslonDogadjajaUtakmice implements OnInit {

  protected readonly vrsteDogadjaja = VRSTE_DOGADJAJA;
  protected readonly smjeroviIzmjene = SMJEROVI_IZMJENE;
  protected readonly bodoviSuta = BODOVI_SUTA;
  protected readonly oblikujVrijemeSemafora = oblikujVrijemeSemafora;
  protected readonly opisDogadjaja = opisDogadjaja;

  protected readonly vidljivihRedaka = VIDLJIVIH_REDAKA_DOGADJAJA;

  protected readonly utakmica = signal<OdgovorUtakmice | null>(null);
  protected readonly sastavi = signal<readonly SastavTima[]>([]);
  protected readonly dogadjaji = signal<readonly GameEvent[]>([]);
  protected readonly pogreska = signal<string | null>(null);
  protected readonly pogreskaObrasca = signal<string | null>(null);
  protected obrazac: ObrazacDogadjaja = pripremiPrazanObrazac();

  protected readonly dijalog = viewChild.required<ElementRef<HTMLDialogElement>>("dijalog");

  readonly #servis: ServisSuceljaRest;
  readonly #oznakaUtakmice: number;

  constructor(servis: ServisSuceljaRest, putanja: ActivatedRoute) {
    this.#servis = servis;
    this.#oznakaUtakmice = Number(putanja.snapshot.paramMap.get("id"));
  }

  ngOnInit(): void {
    void this.#dohvatiPodatke();
  }

  protected get jeSut(): boolean {
    return this.obrazac.type === EventType.SHOT;
  }

  protected get jeIzmjena(): boolean {
    return this.obrazac.type === EventType.SUBSTITUTION;
  }

  protected imeTima(teamId: number): string {
    return this.sastavi().find((sastav) => sastav.tim.id === teamId)?.tim.name ?? "—";
  }

  protected imeIgraca(playerId: number): string {
    const igrac = this.#dohvatiIgraca(playerId);

    return igrac === null ? "—" : `${igrac.firstName} ${igrac.lastName}`;
  }

  protected otvoriDijalog(): void {
    this.pogreskaObrasca.set(null);
    this.dijalog().nativeElement.showModal();
  }

  protected zatvoriDijalog(): void {
    this.dijalog().nativeElement.close();
  }

  protected naZatvaranjeDijaloga(): void {
    this.pogreskaObrasca.set(null);
  }

  protected dodaj(): void {
    void this.#dodaj();
  }

  async #dodaj(): Promise<void> {
    this.pogreskaObrasca.set(null);

    const zahtjev = this.#pretvoriUZahtjev();

    if (zahtjev === null) {
      return;
    }

    try {
      await this.#servis.spremiDogadjaj(this.#oznakaUtakmice, zahtjev);

      this.dogadjaji.set(await this.#servis.dohvatiDogadjaje(this.#oznakaUtakmice));
      this.zatvoriDijalog();
    } catch (pogreska) {
      this.pogreskaObrasca.set(porukaPogreske(pogreska));
    }
  }

  #pretvoriUZahtjev(): ZahtjevZaDogadjaj | null {
    const { playerId, quarter, minute, second, type } = this.obrazac;
    const igrac = playerId === null ? null : this.#dohvatiIgraca(playerId);

    if (igrac === null) {
      this.pogreskaObrasca.set("Odaberite igrača.");

      return null;
    }

    if (quarter === null || minute === null || second === null) {
      this.pogreskaObrasca.set("Unesite četvrtinu, minutu i sekundu.");

      return null;
    }

    const osnovica = { playerId: igrac.id, teamId: igrac.teamId, quarter, minute, second };

    switch (type) {
      case EventType.SHOT:
        return { ...osnovica, type, points: this.obrazac.points, made: this.obrazac.made };
      case EventType.SUBSTITUTION:
        return { ...osnovica, type, direction: this.obrazac.direction };
      default:
        return { ...osnovica, type };
    }
  }

  #dohvatiIgraca(playerId: number): Player | null {
    for (const sastav of this.sastavi()) {
      const igrac = sastav.igraci.find((kandidat) => kandidat.id === playerId);

      if (igrac !== undefined) {
        return igrac;
      }
    }

    return null;
  }

  async #dohvatiPodatke(): Promise<void> {
    try {
      const utakmica = await this.#servis.dohvatiUtakmicu(this.#oznakaUtakmice);

      this.utakmica.set(utakmica);
      this.sastavi.set([
        {
          tim: await this.#servis.dohvatiTim(utakmica.homeTeamId),
          igraci: await this.#servis.dohvatiIgraceTima(utakmica.homeTeamId)
        },
        {
          tim: await this.#servis.dohvatiTim(utakmica.awayTeamId),
          igraci: await this.#servis.dohvatiIgraceTima(utakmica.awayTeamId)
        }
      ]);
      this.dogadjaji.set(await this.#servis.dohvatiDogadjaje(this.#oznakaUtakmice));
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }
}
