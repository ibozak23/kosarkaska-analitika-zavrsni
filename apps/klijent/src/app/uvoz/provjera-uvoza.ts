import { EventType, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";

import { STRANE_UTAKMICE } from "./model-uvoza.js";
import type { PogreskaUvoza, StranaUtakmice, UvezenaUtakmica, UvezeniIgrac } from "./model-uvoza.js";

const IGRACA_NA_TERENU = 5;
const NAJVECA_SEKUNDA = 59;
const POCETNA_CETVRTINA = 1;
const POCETNA_MINUTA = 10;
const POCETNA_SEKUNDA = 0;
const BEZ_RETKA = 0;

type SastaviPoStrani = ReadonlyMap<StranaUtakmice, ReadonlyMap<number, UvezeniIgrac>>;

function oznakaStrane(strana: StranaUtakmice): string {
  return strana === "DOMACI" ? "domaćeg tima" : "gostujućeg tima";
}

function provjeriVrijeme(utakmica: UvezenaUtakmica, pogreske: PogreskaUvoza[]): void {
  if (utakmica.odigranoU === null) {
    pogreske.push({ redak: BEZ_RETKA, poruka: "Nedostaje redak UTAKMICA s datumom i vremenom." });

    return;
  }

  if (Number.isNaN(new Date(utakmica.odigranoU).getTime())) {
    pogreske.push({
      redak: BEZ_RETKA,
      poruka: `Datum i vrijeme "${utakmica.odigranoU}" nisu čitljivi. Očekuje se oblik 2026-03-14T19:00.`
    });
  }
}

function provjeriTimove(utakmica: UvezenaUtakmica, pogreske: PogreskaUvoza[]): void {
  for (const strana of STRANE_UTAKMICE) {
    const timovi = utakmica.timovi.filter((tim) => tim.strana === strana);

    if (timovi.length !== 1) {
      pogreske.push({
        redak: timovi[1]?.redak ?? BEZ_RETKA,
        poruka: `Potreban je točno jedan redak TIM za stranu ${strana}, a pronađeno ih je ${String(timovi.length)}.`
      });
    }
  }

  const domaci = utakmica.timovi.find((tim) => tim.strana === "DOMACI");
  const gosti = utakmica.timovi.find((tim) => tim.strana === "GOSTI");

  if (domaci !== undefined && gosti !== undefined && domaci.naziv.trim().toLowerCase() === gosti.naziv.trim().toLowerCase()) {
    pogreske.push({ redak: gosti.redak, poruka: "Domaći i gostujući tim ne smiju imati isti naziv." });
  }
}

function sastaviSastav(
  utakmica: UvezenaUtakmica,
  strana: StranaUtakmice,
  pogreske: PogreskaUvoza[]
): ReadonlyMap<number, UvezeniIgrac> {
  const sastav = new Map<number, UvezeniIgrac>();

  for (const igrac of utakmica.igraci) {
    if (igrac.strana !== strana) {
      continue;
    }

    if (sastav.has(igrac.dres)) {
      pogreske.push({
        redak: igrac.redak,
        poruka: `Broj dresa ${String(igrac.dres)} već je zauzet u sastavu ${oznakaStrane(strana)}.`
      });
      continue;
    }

    sastav.set(igrac.dres, igrac);
  }

  if (sastav.size < IGRACA_NA_TERENU) {
    pogreske.push({
      redak: BEZ_RETKA,
      poruka: `Sastav ${oznakaStrane(strana)} ima ${String(sastav.size)} igrača, a potrebno ih je barem ${String(IGRACA_NA_TERENU)}.`
    });
  }

  return sastav;
}

function provjeriPetorku(
  utakmica: UvezenaUtakmica,
  strana: StranaUtakmice,
  sastav: ReadonlyMap<number, UvezeniIgrac>,
  pogreske: PogreskaUvoza[]
): void {
  const petorke = utakmica.petorke.filter((petorka) => petorka.strana === strana);

  if (petorke.length !== 1) {
    pogreske.push({
      redak: petorke[1]?.redak ?? BEZ_RETKA,
      poruka: `Potreban je točno jedan redak POCETNA za stranu ${strana}, a pronađeno ih je ${String(petorke.length)}.`
    });

    return;
  }

  const petorka = petorke[0];

  if (petorka === undefined) {
    return;
  }

  if (petorka.dresovi.length !== IGRACA_NA_TERENU) {
    pogreske.push({
      redak: petorka.redak,
      poruka: `Početna petorka ${oznakaStrane(strana)} mora imati točno ${String(IGRACA_NA_TERENU)} igrača, a navedeno ih je ${String(petorka.dresovi.length)}.`
    });
  }

  const vidjeni = new Set<number>();

  for (const dres of petorka.dresovi) {
    if (vidjeni.has(dres)) {
      pogreske.push({
        redak: petorka.redak,
        poruka: `Broj dresa ${String(dres)} naveden je dvaput u početnoj petorci ${oznakaStrane(strana)}.`
      });
      continue;
    }

    vidjeni.add(dres);

    if (!sastav.has(dres)) {
      pogreske.push({
        redak: petorka.redak,
        poruka: `Igrač s dresom ${String(dres)} nije upisan u sastav ${oznakaStrane(strana)}.`
      });
    }
  }
}

function dohvatiPocetnePetorke(utakmica: UvezenaUtakmica): ReadonlyMap<StranaUtakmice, ReadonlySet<number>> {
  const petorke = new Map<StranaUtakmice, ReadonlySet<number>>();

  for (const strana of STRANE_UTAKMICE) {
    const petorka = utakmica.petorke.find((kandidat) => kandidat.strana === strana);

    petorke.set(strana, new Set(petorka?.dresovi ?? []));
  }

  return petorke;
}

function jeUlazakPocetnePetorke(
  dogadjaj: UvezenaUtakmica["dogadjaji"][number],
  petorke: ReadonlyMap<StranaUtakmice, ReadonlySet<number>>
): boolean {
  return (
    dogadjaj.tip === EventType.SUBSTITUTION
    && dogadjaj.smjer === SubstitutionDirection.IN
    && dogadjaj.cetvrtina === POCETNA_CETVRTINA
    && dogadjaj.minuta === POCETNA_MINUTA
    && dogadjaj.sekunda === POCETNA_SEKUNDA
    && (petorke.get(dogadjaj.strana)?.has(dogadjaj.dres) ?? false)
  );
}

function provjeriDogadjaje(utakmica: UvezenaUtakmica, sastavi: SastaviPoStrani, pogreske: PogreskaUvoza[]): void {
  const petorke = dohvatiPocetnePetorke(utakmica);

  for (const dogadjaj of utakmica.dogadjaji) {
    if (dogadjaj.cetvrtina < POCETNA_CETVRTINA) {
      pogreske.push({ redak: dogadjaj.redak, poruka: "Četvrtina mora biti cijeli broj veći od nule." });
    }

    if (dogadjaj.minuta < 0 || dogadjaj.sekunda < 0 || dogadjaj.sekunda > NAJVECA_SEKUNDA) {
      pogreske.push({
        redak: dogadjaj.redak,
        poruka: `Vrijeme na semaforu nije ispravno: minuta ne smije biti negativna, a sekunda mora biti između 0 i ${String(NAJVECA_SEKUNDA)}.`
      });
    }

    if (!(sastavi.get(dogadjaj.strana)?.has(dogadjaj.dres) ?? false)) {
      pogreske.push({
        redak: dogadjaj.redak,
        poruka: `Igrač s dresom ${String(dogadjaj.dres)} nije upisan u sastav ${oznakaStrane(dogadjaj.strana)}.`
      });
    }

    if (jeUlazakPocetnePetorke(dogadjaj, petorke)) {
      pogreske.push({
        redak: dogadjaj.redak,
        poruka: "Ulazak početne petorke ne upisuje se kao DOGADJAJ jer nastaje iz retka POCETNA."
      });
    }
  }
}

export function provjeriUtakmicu(utakmica: UvezenaUtakmica): PogreskaUvoza[] {
  const pogreske: PogreskaUvoza[] = [];

  provjeriVrijeme(utakmica, pogreske);
  provjeriTimove(utakmica, pogreske);

  const sastavi = new Map<StranaUtakmice, ReadonlyMap<number, UvezeniIgrac>>();

  for (const strana of STRANE_UTAKMICE) {
    const sastav = sastaviSastav(utakmica, strana, pogreske);

    sastavi.set(strana, sastav);
    provjeriPetorku(utakmica, strana, sastav, pogreske);
  }

  provjeriDogadjaje(utakmica, sastavi, pogreske);

  return pogreske.sort((prva, druga) => prva.redak - druga.redak);
}
