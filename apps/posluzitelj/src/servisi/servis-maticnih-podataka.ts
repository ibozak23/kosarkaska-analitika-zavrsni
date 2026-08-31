import type { Player, Team } from "@ibozak23/kosarkaska-analitika";

import { PogreskaNepostojecegZapisa, PogreskaProvjere } from "../pogreske/pogreske.js";
import type { RepozitorijDogadjaja } from "../repozitoriji/repozitorij-dogadjaja.js";
import type { IgracZaUpis, RepozitorijIgraca } from "../repozitoriji/repozitorij-igraca.js";
import type { TimZaUpis, RepozitorijTimova } from "../repozitoriji/repozitorij-timova.js";

const NAJMANJA_VISINA_CM = 100;
const NAJVECA_VISINA_CM = 250;
const NAJMANJI_BROJ_DRESA = 0;
const NAJVECI_BROJ_DRESA = 99;

function provjeriObavezniTekst(vrijednost: string, imePolja: string): string {
  const ociscen = vrijednost.trim();

  if (ociscen.length === 0) {
    throw new PogreskaProvjere(`Polje ${imePolja} ne smije biti prazno.`);
  }

  return ociscen;
}

function pripremiNeobavezniTekst(vrijednost: string | null): string | null {
  const ociscen = vrijednost === null ? "" : vrijednost.trim();

  return ociscen.length === 0 ? null : ociscen;
}

function pripremiNeobavezniCijeliBroj(
  vrijednost: number | null,
  najmanje: number,
  najvise: number,
  imePolja: string
): number | null {
  if (vrijednost === null) {
    return null;
  }

  if (!Number.isInteger(vrijednost) || vrijednost < najmanje || vrijednost > najvise) {
    throw new PogreskaProvjere(`Polje ${imePolja} mora biti cijeli broj između ${najmanje} i ${najvise}.`);
  }

  return vrijednost;
}

export class ServisMaticnihPodataka {
  readonly #timovi: RepozitorijTimova;
  readonly #igraci: RepozitorijIgraca;
  readonly #dogadjaji: RepozitorijDogadjaja;

  constructor(timovi: RepozitorijTimova, players: RepozitorijIgraca, dogadjaji: RepozitorijDogadjaja) {
    this.#timovi = timovi;
    this.#igraci = players;
    this.#dogadjaji = dogadjaji;
  }

  dohvatiTimove(): Team[] {
    return this.#timovi.dohvatiSve();
  }

  dohvatiTim(id: number): Team {
    const tim = this.#timovi.dohvatiPoOznaci(id);

    if (tim === null) {
      throw new PogreskaNepostojecegZapisa(`Tim ${id} ne postoji.`);
    }

    return tim;
  }

  spremiTim(ulaz: TimZaUpis): Team {
    return this.#timovi.spremi(pripremiTimZaUpis(ulaz));
  }

  izmijeniTim(id: number, ulaz: TimZaUpis): Team {
    this.dohvatiTim(id);

    return this.#timovi.izmijeni(id, pripremiTimZaUpis(ulaz));
  }

  obrisiTim(id: number): void {
    this.dohvatiTim(id);

    if (this.#igraci.dohvatiZaTim(id).length > 0) {
      throw new PogreskaProvjere(`Tim ${id} ima upisane igrače, pa se ne može obrisati.`);
    }

    this.#timovi.obrisi(id);
  }

  dohvatiIgrace(): Player[] {
    return this.#igraci.dohvatiSve();
  }

  dohvatiIgraceTima(teamId: number): Player[] {
    this.dohvatiTim(teamId);

    return this.#igraci.dohvatiZaTim(teamId);
  }

  dohvatiIgraca(id: number): Player {
    const igrac = this.#igraci.dohvatiPoOznaci(id);

    if (igrac === null) {
      throw new PogreskaNepostojecegZapisa(`Igrač ${id} ne postoji.`);
    }

    return igrac;
  }

  spremiIgraca(ulaz: IgracZaUpis): Player {
    return this.#igraci.spremi(pripremiIgracaZaUpis(ulaz));
  }

  izmijeniIgraca(id: number, ulaz: IgracZaUpis): Player {
    this.dohvatiIgraca(id);

    return this.#igraci.izmijeni(id, pripremiIgracaZaUpis(ulaz));
  }

  obrisiIgraca(id: number): void {
    this.dohvatiIgraca(id);

    if (this.#dogadjaji.izbrojiZaIgraca(id) > 0) {
      throw new PogreskaProvjere(`Igrač ${id} ima zapisane događaje, pa se ne može obrisati.`);
    }

    this.#igraci.obrisi(id);
  }
}

function pripremiTimZaUpis(ulaz: TimZaUpis): TimZaUpis {
  return {
    name: provjeriObavezniTekst(ulaz.name, "naziv"),
    city: pripremiNeobavezniTekst(ulaz.city),
    league: pripremiNeobavezniTekst(ulaz.league),
    season: pripremiNeobavezniTekst(ulaz.season)
  };
}

function pripremiIgracaZaUpis(ulaz: IgracZaUpis): IgracZaUpis {
  return {
    firstName: provjeriObavezniTekst(ulaz.firstName, "ime"),
    lastName: provjeriObavezniTekst(ulaz.lastName, "prezime"),
    position: ulaz.position,
    heightCm: pripremiNeobavezniCijeliBroj(ulaz.heightCm, NAJMANJA_VISINA_CM, NAJVECA_VISINA_CM, "visina"),
    jerseyNumber: pripremiNeobavezniCijeliBroj(
      ulaz.jerseyNumber,
      NAJMANJI_BROJ_DRESA,
      NAJVECI_BROJ_DRESA,
      "broj dresa"
    ),
    teamId: ulaz.teamId
  };
}
