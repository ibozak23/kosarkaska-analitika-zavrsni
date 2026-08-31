import { EventType, GameStatus, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";
import type { Game, GameEvent, Player } from "@ibozak23/kosarkaska-analitika";

import { PogreskaNepostojecegZapisa, PogreskaProvjere } from "../pogreske/pogreske.js";
import type { DogadjajZaUpis } from "../repozitoriji/preslikivac-dogadjaja.js";
import type { RepozitorijDogadjaja } from "../repozitoriji/repozitorij-dogadjaja.js";
import type { RepozitorijUtakmica } from "../repozitoriji/repozitorij-utakmica.js";
import type { RepozitorijIgraca } from "../repozitoriji/repozitorij-igraca.js";

export interface PrijavaUtakmice {
  readonly playedAt: Date;
  readonly homeTeamId: number;
  readonly awayTeamId: number;
  readonly homeStarters: readonly number[];
  readonly awayStarters: readonly number[];
}

interface KorakIzmjene {
  readonly apsolutnaSekunda: number;
  readonly direction: SubstitutionDirection;
  readonly playerId: number;
  readonly teamId: number;
  readonly oznakaVremena: string;
}

const SEKUNDI_U_MINUTI = 60;
const REDOVNIH_CETVRTINA = 4;
const SEKUNDI_U_CETVRTINI = 600;
const SEKUNDI_U_PRODUZETKU = 300;
const IGRACA_NA_TERENU = 5;

const POCETNA_CETVRTINA = 1;
const POCETNA_MINUTA = 10;
const POCETNA_SEKUNDA = 0;

function izracunajTrajanjeCetvrtine(quarter: number): number {
  return quarter <= REDOVNIH_CETVRTINA ? SEKUNDI_U_CETVRTINI : SEKUNDI_U_PRODUZETKU;
}

function pretvoriUApsolutnuSekundu(quarter: number, minute: number, second: number): number {
  const remaining = minute * SEKUNDI_U_MINUTI + second;

  if (quarter <= REDOVNIH_CETVRTINA) {
    return (quarter - 1) * SEKUNDI_U_CETVRTINI + (SEKUNDI_U_CETVRTINI - remaining);
  }

  return REDOVNIH_CETVRTINA * SEKUNDI_U_CETVRTINI
    + (quarter - REDOVNIH_CETVRTINA - 1) * SEKUNDI_U_PRODUZETKU
    + (SEKUNDI_U_PRODUZETKU - remaining);
}

function oblikujVrijemeSemafora(quarter: number, minute: number, second: number): string {
  return `${quarter}. četvrtina, ${minute}:${String(second).padStart(2, "0")}`;
}

function pretvoriDogadjajUKorakIzmjene(event: {
  quarter: number;
  minute: number;
  second: number;
  playerId: number;
  teamId: number;
  direction: SubstitutionDirection;
}): KorakIzmjene {
  return {
    apsolutnaSekunda: pretvoriUApsolutnuSekundu(event.quarter, event.minute, event.second),
    direction: event.direction,
    playerId: event.playerId,
    teamId: event.teamId,
    oznakaVremena: oblikujVrijemeSemafora(event.quarter, event.minute, event.second)
  };
}

// Kad se dvije izmjene dogode u istoj sekundi, izlazak mora doći prije ulaska
function izracunajPoredakSmjera(direction: SubstitutionDirection): number {
  return direction === SubstitutionDirection.OUT ? 0 : 1;
}

export class ServisUtakmica {
  readonly #utakmice: RepozitorijUtakmica;
  readonly #dogadjaji: RepozitorijDogadjaja;
  readonly #igraci: RepozitorijIgraca;

  constructor(utakmice: RepozitorijUtakmica, dogadjaji: RepozitorijDogadjaja, players: RepozitorijIgraca) {
    this.#utakmice = utakmice;
    this.#dogadjaji = dogadjaji;
    this.#igraci = players;
  }

  dohvatiUtakmice(): Game[] {
    return this.#utakmice.dohvatiSve();
  }

  dohvatiUtakmicu(id: number): Game {
    const utakmica = this.#utakmice.dohvatiPoOznaci(id);

    if (utakmica === null) {
      throw new PogreskaNepostojecegZapisa(`Utakmica ${id} ne postoji.`);
    }

    return utakmica;
  }

  dohvatiDogadjaje(gameId: number): GameEvent[] {
    this.dohvatiUtakmicu(gameId);

    return this.#dogadjaji.dohvatiZaUtakmicu(gameId);
  }

  spremiPrijavuUtakmice(ulaz: PrijavaUtakmice): Game {
    if (ulaz.homeTeamId === ulaz.awayTeamId) {
      throw new PogreskaProvjere("Domaći i gostujući tim ne mogu biti isti tim.");
    }

    const pocetnaPetorka = [
      ...this.#dohvatiObaveznuPocetnuPetorku(ulaz.homeStarters, ulaz.homeTeamId),
      ...this.#dohvatiObaveznuPocetnuPetorku(ulaz.awayStarters, ulaz.awayTeamId)
    ];

    const utakmica = this.#utakmice.spremi({
      playedAt: ulaz.playedAt,
      homeTeamId: ulaz.homeTeamId,
      awayTeamId: ulaz.awayTeamId,
      status: GameStatus.IN_PROGRESS
    });

    this.#dogadjaji.spremiVise(
      pocetnaPetorka.map((igrac) => ({
        type: EventType.SUBSTITUTION,
        gameId: utakmica.id,
        playerId: igrac.id,
        teamId: igrac.teamId,
        quarter: POCETNA_CETVRTINA,
        minute: POCETNA_MINUTA,
        second: POCETNA_SEKUNDA,
        direction: SubstitutionDirection.IN
      }))
    );

    return utakmica;
  }

  spremiDogadjaj(gameId: number, ulaz: DogadjajZaUpis): GameEvent {
    const utakmica = this.dohvatiUtakmicu(gameId);

    if (utakmica.status !== GameStatus.IN_PROGRESS) {
      throw new PogreskaProvjere(`Utakmica ${gameId} nije u tijeku, pa se događaji ne mogu unositi.`);
    }

    this.#dohvatiObaveznogIgraca(ulaz.playerId);

    if (ulaz.minute * SEKUNDI_U_MINUTI + ulaz.second > izracunajTrajanjeCetvrtine(ulaz.quarter)) {
      throw new PogreskaProvjere(
        `Vrijeme ${oblikujVrijemeSemafora(ulaz.quarter, ulaz.minute, ulaz.second)} izvan je trajanja te četvrtine.`
      );
    }

    if (ulaz.type === EventType.SUBSTITUTION) {
      this.#provjeriNizIzmjena(gameId, pretvoriDogadjajUKorakIzmjene(ulaz));
    }

    return this.#dogadjaji.spremi(ulaz);
  }

  izmijeniUtakmicuUZavrsenu(id: number): Game {
    const utakmica = this.dohvatiUtakmicu(id);

    this.#utakmice.izmijeniUZavrsenu(id);

    return { ...utakmica, status: GameStatus.FINISHED };
  }

  #dohvatiObaveznogIgraca(playerId: number): Player {
    const igrac = this.#igraci.dohvatiPoOznaci(playerId);

    if (igrac === null) {
      throw new PogreskaProvjere(`Igrač ${playerId} ne postoji.`);
    }

    return igrac;
  }

  #dohvatiObaveznuPocetnuPetorku(playerIds: readonly number[], teamId: number): Player[] {
    if (playerIds.length !== IGRACA_NA_TERENU) {
      throw new PogreskaProvjere(
        `Početna petorka tima ${teamId} mora imati točno ${IGRACA_NA_TERENU} igrača.`
      );
    }

    return playerIds.map((playerId) => {
      const igrac = this.#dohvatiObaveznogIgraca(playerId);

      if (igrac.teamId !== teamId) {
        throw new PogreskaProvjere(`Igrač ${playerId} nije član tima ${teamId}.`);
      }

      return igrac;
    });
  }

  #provjeriNizIzmjena(gameId: number, novi: KorakIzmjene): void {
    const koraci: KorakIzmjene[] = [novi];

    for (const event of this.#dogadjaji.dohvatiZaUtakmicu(gameId)) {
      if (event.type === EventType.SUBSTITUTION) {
        koraci.push(pretvoriDogadjajUKorakIzmjene(event));
      }
    }

    koraci.sort(
      (prvi, drugi) =>
        prvi.apsolutnaSekunda - drugi.apsolutnaSekunda
        || izracunajPoredakSmjera(prvi.direction) - izracunajPoredakSmjera(drugi.direction)
    );

    const igraciNaTerenu = new Map<number, Set<number>>();

    for (const korak of koraci) {
      let naTerenu = igraciNaTerenu.get(korak.teamId);

      if (naTerenu === undefined) {
        naTerenu = new Set<number>();
        igraciNaTerenu.set(korak.teamId, naTerenu);
      }

      if (korak.direction === SubstitutionDirection.OUT) {
        if (!naTerenu.has(korak.playerId)) {
          throw new PogreskaProvjere(
            `Igrač ${korak.playerId} izlazi u ${korak.oznakaVremena}, a u tom trenutku nije na terenu.`
          );
        }

        naTerenu.delete(korak.playerId);
        continue;
      }

      if (naTerenu.has(korak.playerId)) {
        throw new PogreskaProvjere(
          `Igrač ${korak.playerId} ulazi u ${korak.oznakaVremena}, a već je na terenu.`
        );
      }

      if (naTerenu.size >= IGRACA_NA_TERENU) {
        throw new PogreskaProvjere(
          `Ulaskom igrača ${korak.playerId} u ${korak.oznakaVremena} tim ${korak.teamId} imao bi više od ${IGRACA_NA_TERENU} igrača na terenu.`
        );
      }

      naTerenu.add(korak.playerId);
    }
  }
}
