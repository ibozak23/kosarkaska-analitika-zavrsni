import { EventType, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";
import type { Game, Position } from "@ibozak23/kosarkaska-analitika";

import type { PokretacTransakcije } from "../baza/veza-s-bazom.js";
import { PogreskaNepostojecegZapisa, PogreskaProvjere } from "../pogreske/pogreske.js";
import type { DogadjajZaUpis } from "../repozitoriji/preslikivac-dogadjaja.js";
import type { ServisMaticnihPodataka } from "./servis-maticnih-podataka.js";
import type { ServisUtakmica } from "./servis-utakmica.js";

export const STRANE_UTAKMICE = ["HOME", "AWAY"] as const;

export type StranaUtakmice = (typeof STRANE_UTAKMICE)[number];

export interface UvozTima {
  readonly name: string;
  readonly city: string | null;
  readonly league: string | null;
  readonly season: string | null;
}

export interface UvozIgraca {
  readonly jerseyNumber: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly position: Position;
  readonly heightCm: number | null;
}

export interface UvozStrane {
  readonly team: UvozTima;
  readonly players: readonly UvozIgraca[];
  readonly starters: readonly number[];
}

export interface UvozDogadjajaOsnova {
  readonly side: StranaUtakmice;
  readonly jerseyNumber: number;
  readonly quarter: number;
  readonly minute: number;
  readonly second: number;
}

export type UvozDogadjaja =
  | (UvozDogadjajaOsnova & { readonly type: EventType.SHOT; readonly points: 1 | 2 | 3; readonly made: boolean })
  | (UvozDogadjajaOsnova & { readonly type: EventType.SUBSTITUTION; readonly direction: SubstitutionDirection })
  | (UvozDogadjajaOsnova & { readonly type: Exclude<EventType, EventType.SHOT | EventType.SUBSTITUTION> });

export interface UvozUtakmice {
  readonly playedAt: Date;
  readonly home: UvozStrane;
  readonly away: UvozStrane;
  readonly events: readonly UvozDogadjaja[];
}

export interface IshodUvoza {
  readonly game: Game;
  readonly eventCount: number;
  readonly createdTeams: number;
  readonly createdPlayers: number;
}

interface RazlucenaStrana {
  readonly teamId: number;
  readonly igraciPoDresu: ReadonlyMap<number, number>;
}

interface BrojacStvorenih {
  timovi: number;
  igraci: number;
}

const SEKUNDI_U_MINUTI = 60;
const POREDAK_IZLASKA = 0;
const POREDAK_ULASKA = 1;
const POREDAK_OSTALIH = 2;

function izracunajPoredakSmjera(dogadjaj: UvozDogadjaja): number {
  if (dogadjaj.type !== EventType.SUBSTITUTION) {
    return POREDAK_OSTALIH;
  }

  return dogadjaj.direction === SubstitutionDirection.OUT ? POREDAK_IZLASKA : POREDAK_ULASKA;
}

function izracunajPreostaleSekunde(dogadjaj: UvozDogadjaja): number {
  return dogadjaj.minute * SEKUNDI_U_MINUTI + dogadjaj.second;
}

export function usporediDogadjaje(prvi: UvozDogadjaja, drugi: UvozDogadjaja): number {
  return (
    prvi.quarter - drugi.quarter
    || izracunajPreostaleSekunde(drugi) - izracunajPreostaleSekunde(prvi)
    || izracunajPoredakSmjera(prvi) - izracunajPoredakSmjera(drugi)
  );
}

export function poredajDogadjaje(dogadjaji: readonly UvozDogadjaja[]): UvozDogadjaja[] {
  return [...dogadjaji].sort(usporediDogadjaje);
}

export function opisDogadjaja(dogadjaj: UvozDogadjaja): string {
  const strana = dogadjaj.side === "HOME" ? "domaci" : "gosti";
  const sekunda = String(dogadjaj.second).padStart(2, "0");

  return `${dogadjaj.type}, ${strana} #${String(dogadjaj.jerseyNumber)}, ${String(dogadjaj.quarter)}. četvrtina, ${String(dogadjaj.minute)}:${sekunda}`;
}

function pretvoriUDogadjajZaUpis(
  gameId: number,
  dogadjaj: UvozDogadjaja,
  playerId: number,
  teamId: number
): DogadjajZaUpis {
  const osnova = {
    gameId,
    playerId,
    teamId,
    quarter: dogadjaj.quarter,
    minute: dogadjaj.minute,
    second: dogadjaj.second
  };

  switch (dogadjaj.type) {
    case EventType.SHOT:
      return { ...osnova, type: dogadjaj.type, points: dogadjaj.points, made: dogadjaj.made };
    case EventType.SUBSTITUTION:
      return { ...osnova, type: dogadjaj.type, direction: dogadjaj.direction };
    default:
      return { ...osnova, type: dogadjaj.type };
  }
}

function razluciPetorku(dresovi: readonly number[], strana: RazlucenaStrana): number[] {
  return dresovi.map((dres) => {
    const playerId = strana.igraciPoDresu.get(dres);

    if (playerId === undefined) {
      throw new PogreskaProvjere(`Igrač s dresom ${String(dres)} nije u sastavu svojega tima.`);
    }

    return playerId;
  });
}

function pripremiPogreskuDogadjaja(dogadjaj: UvozDogadjaja, pogreska: unknown): unknown {
  if (pogreska instanceof PogreskaProvjere || pogreska instanceof PogreskaNepostojecegZapisa) {
    return new PogreskaProvjere(`Događaj ${opisDogadjaja(dogadjaj)}: ${pogreska.message}`);
  }

  return pogreska;
}

export class ServisUvozaUtakmice {
  readonly #maticniPodaci: ServisMaticnihPodataka;
  readonly #utakmice: ServisUtakmica;
  readonly #uTransakciji: PokretacTransakcije;

  constructor(maticniPodaci: ServisMaticnihPodataka, utakmice: ServisUtakmica, uTransakciji: PokretacTransakcije) {
    this.#maticniPodaci = maticniPodaci;
    this.#utakmice = utakmice;
    this.#uTransakciji = uTransakciji;
  }

  uveziUtakmicu(ulaz: UvozUtakmice): IshodUvoza {
    return this.#uTransakciji(() => this.#upisiUtakmicu(ulaz));
  }

  #upisiUtakmicu(ulaz: UvozUtakmice): IshodUvoza {
    if (Number.isNaN(ulaz.playedAt.getTime())) {
      throw new PogreskaProvjere("Polje playedAt nije čitljiv datum i vrijeme.");
    }

    const brojac: BrojacStvorenih = { timovi: 0, igraci: 0 };
    const domaci = this.#razluciStranu(ulaz.home, brojac);
    const gosti = this.#razluciStranu(ulaz.away, brojac);

    const utakmica = this.#utakmice.spremiPrijavuUtakmice({
      playedAt: ulaz.playedAt,
      homeTeamId: domaci.teamId,
      awayTeamId: gosti.teamId,
      homeStarters: razluciPetorku(ulaz.home.starters, domaci),
      awayStarters: razluciPetorku(ulaz.away.starters, gosti)
    });

    this.#upisiDogadjaje(utakmica.id, ulaz.events, domaci, gosti);

    return {
      game: this.#utakmice.izmijeniUtakmicuUZavrsenu(utakmica.id),
      eventCount: ulaz.events.length,
      createdTeams: brojac.timovi,
      createdPlayers: brojac.igraci
    };
  }

  #razluciStranu(strana: UvozStrane, brojac: BrojacStvorenih): RazlucenaStrana {
    const teamId = this.#razluciTim(strana.team, brojac);

    return { teamId, igraciPoDresu: this.#razluciIgrace(teamId, strana.players, brojac) };
  }

  #razluciTim(tim: UvozTima, brojac: BrojacStvorenih): number {
    const trazeni = tim.name.trim().toLowerCase();
    const postojeci = this.#maticniPodaci
      .dohvatiTimove()
      .find((kandidat) => kandidat.name.trim().toLowerCase() === trazeni);

    if (postojeci !== undefined) {
      return postojeci.id;
    }

    brojac.timovi += 1;

    return this.#maticniPodaci.spremiTim(tim).id;
  }

  #razluciIgrace(
    teamId: number,
    igraci: readonly UvozIgraca[],
    brojac: BrojacStvorenih
  ): ReadonlyMap<number, number> {
    const poDresu = new Map<number, number>();

    for (const postojeci of this.#maticniPodaci.dohvatiIgraceTima(teamId)) {
      if (postojeci.jerseyNumber !== null && !poDresu.has(postojeci.jerseyNumber)) {
        poDresu.set(postojeci.jerseyNumber, postojeci.id);
      }
    }

    const dresoviUZahtjevu = new Set<number>();

    for (const igrac of igraci) {
      if (dresoviUZahtjevu.has(igrac.jerseyNumber)) {
        throw new PogreskaProvjere(
          `Broj dresa ${String(igrac.jerseyNumber)} pojavljuje se dvaput u istom sastavu.`
        );
      }

      dresoviUZahtjevu.add(igrac.jerseyNumber);

      if (poDresu.has(igrac.jerseyNumber)) {
        continue;
      }

      brojac.igraci += 1;
      poDresu.set(igrac.jerseyNumber, this.#maticniPodaci.spremiIgraca({ ...igrac, teamId }).id);
    }

    return poDresu;
  }

  #upisiDogadjaje(
    gameId: number,
    dogadjaji: readonly UvozDogadjaja[],
    domaci: RazlucenaStrana,
    gosti: RazlucenaStrana
  ): void {
    for (const dogadjaj of poredajDogadjaje(dogadjaji)) {
      const strana = dogadjaj.side === "HOME" ? domaci : gosti;
      const playerId = strana.igraciPoDresu.get(dogadjaj.jerseyNumber);

      if (playerId === undefined) {
        throw new PogreskaProvjere(`Događaj ${opisDogadjaja(dogadjaj)} nije u sastavu svojega tima.`);
      }

      try {
        this.#utakmice.spremiDogadjaj(gameId, pretvoriUDogadjajZaUpis(gameId, dogadjaj, playerId, strana.teamId));
      } catch (pogreska) {
        throw pripremiPogreskuDogadjaja(dogadjaj, pogreska);
      }
    }
  }
}
