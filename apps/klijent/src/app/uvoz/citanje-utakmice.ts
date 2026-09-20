import { EventType, Position, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";

import { procitajCsv } from "./citac-csv.js";
import type { RedakCsv } from "./citac-csv.js";
import type {
  IshodCitanja,
  PogreskaUvoza,
  StranaUtakmice,
  UvezenaPetorka,
  UvezeniDogadjaj,
  UvezeniIgrac,
  UvezeniTim
} from "./model-uvoza.js";

const VRSTA_ZAGLAVLJA = "VRSTA";
const VRSTA_UTAKMICE = "UTAKMICA";
const VRSTA_TIMA = "TIM";
const VRSTA_IGRACA = "IGRAC";
const VRSTA_PETORKE = "POCETNA";
const VRSTA_DOGADJAJA = "DOGADJAJ";

const ISTINITE_VRIJEDNOSTI = ["DA", "TRUE", "1"];
const LAZNE_VRIJEDNOSTI = ["NE", "FALSE", "0"];

interface SkupRedaka {
  odigranoU: string | null;
  readonly timovi: UvezeniTim[];
  readonly igraci: UvezeniIgrac[];
  readonly petorke: UvezenaPetorka[];
  readonly dogadjaji: UvezeniDogadjaj[];
}

function dohvatiCeliju(redak: RedakCsv, stupac: number): string {
  return redak.celije[stupac] ?? "";
}

function obavezanTekst(redak: RedakCsv, stupac: number, naziv: string): string {
  const vrijednost = dohvatiCeliju(redak, stupac);

  if (vrijednost.length === 0) {
    throw new Error(`Stupac ${naziv} ne smije biti prazan.`);
  }

  return vrijednost;
}

function neobavezanTekst(redak: RedakCsv, stupac: number): string | null {
  const vrijednost = dohvatiCeliju(redak, stupac);

  return vrijednost.length === 0 ? null : vrijednost;
}

function pretvoriUCijeliBroj(vrijednost: string, naziv: string): number {
  const broj = Number(vrijednost);

  if (!Number.isInteger(broj)) {
    throw new Error(`Stupac ${naziv} mora biti cijeli broj.`);
  }

  return broj;
}

function obavezanCijeliBroj(redak: RedakCsv, stupac: number, naziv: string): number {
  return pretvoriUCijeliBroj(obavezanTekst(redak, stupac, naziv), naziv);
}

function neobavezanCijeliBroj(redak: RedakCsv, stupac: number, naziv: string): number | null {
  const vrijednost = neobavezanTekst(redak, stupac);

  return vrijednost === null ? null : pretvoriUCijeliBroj(vrijednost, naziv);
}

function procitajStranu(redak: RedakCsv, stupac: number): StranaUtakmice {
  const vrijednost = obavezanTekst(redak, stupac, "strana").toUpperCase();

  if (vrijednost === "DOMACI" || vrijednost === "HOME") {
    return "DOMACI";
  }

  if (vrijednost === "GOSTI" || vrijednost === "GOSTUJUCI" || vrijednost === "AWAY") {
    return "GOSTI";
  }

  throw new Error("Stupac strana mora biti DOMACI ili GOSTI.");
}

function procitajVrijednostNabrajanja<TVrijednost extends string>(
  vrijednost: string,
  dopustene: readonly TVrijednost[],
  naziv: string
): TVrijednost {
  for (const kandidat of dopustene) {
    if (kandidat === vrijednost) {
      return kandidat;
    }
  }

  throw new Error(`Stupac ${naziv} mora biti jedna od vrijednosti: ${dopustene.join(", ")}.`);
}

function procitajLogickuVrijednost(vrijednost: string, naziv: string): boolean {
  const oblik = vrijednost.toUpperCase();

  if (ISTINITE_VRIJEDNOSTI.includes(oblik)) {
    return true;
  }

  if (LAZNE_VRIJEDNOSTI.includes(oblik)) {
    return false;
  }

  throw new Error(`Stupac ${naziv} mora biti DA ili NE.`);
}

function procitajSmjer(vrijednost: string): SubstitutionDirection {
  const oblik = vrijednost.toUpperCase();

  if (oblik === "IN" || oblik === "ULAZ") {
    return SubstitutionDirection.IN;
  }

  if (oblik === "OUT" || oblik === "IZLAZ") {
    return SubstitutionDirection.OUT;
  }

  throw new Error("Stupac smjer mora biti IN ili OUT.");
}

function procitajPoene(redak: RedakCsv): 1 | 2 | 3 {
  const poeni = obavezanCijeliBroj(redak, 7, "poeni");

  if (poeni !== 1 && poeni !== 2 && poeni !== 3) {
    throw new Error("Stupac poeni mora biti 1, 2 ili 3.");
  }

  return poeni;
}

function procitajTim(redak: RedakCsv): UvezeniTim {
  return {
    redak: redak.redak,
    strana: procitajStranu(redak, 1),
    naziv: obavezanTekst(redak, 2, "naziv"),
    grad: neobavezanTekst(redak, 3),
    liga: neobavezanTekst(redak, 4),
    sezona: neobavezanTekst(redak, 5)
  };
}

function procitajIgraca(redak: RedakCsv): UvezeniIgrac {
  return {
    redak: redak.redak,
    strana: procitajStranu(redak, 1),
    dres: obavezanCijeliBroj(redak, 2, "dres"),
    ime: obavezanTekst(redak, 3, "ime"),
    prezime: obavezanTekst(redak, 4, "prezime"),
    pozicija: procitajVrijednostNabrajanja(
      obavezanTekst(redak, 5, "pozicija").toUpperCase(),
      Object.values(Position),
      "pozicija"
    ),
    visina: neobavezanCijeliBroj(redak, 6, "visina")
  };
}

function procitajPetorku(redak: RedakCsv): UvezenaPetorka {
  const strana = procitajStranu(redak, 1);
  const dresovi = redak.celije
    .slice(2)
    .filter((celija) => celija.length > 0)
    .map((celija) => pretvoriUCijeliBroj(celija, "dres"));

  return { redak: redak.redak, strana, dresovi };
}

function procitajDogadjaj(redak: RedakCsv): UvezeniDogadjaj {
  const osnova = {
    redak: redak.redak,
    cetvrtina: obavezanCijeliBroj(redak, 1, "cetvrtina"),
    minuta: obavezanCijeliBroj(redak, 2, "minuta"),
    sekunda: obavezanCijeliBroj(redak, 3, "sekunda"),
    strana: procitajStranu(redak, 4),
    dres: obavezanCijeliBroj(redak, 5, "dres")
  };

  const tip = procitajVrijednostNabrajanja(
    obavezanTekst(redak, 6, "tip").toUpperCase(),
    Object.values(EventType),
    "tip"
  );

  const poeni = neobavezanTekst(redak, 7);
  const pogodak = neobavezanTekst(redak, 8);
  const smjer = neobavezanTekst(redak, 9);

  if (tip !== EventType.SHOT && (poeni !== null || pogodak !== null)) {
    throw new Error(`Stupci poeni i pogodak popunjavaju se samo za tip ${EventType.SHOT}.`);
  }

  if (tip !== EventType.SUBSTITUTION && smjer !== null) {
    throw new Error(`Stupac smjer popunjava se samo za tip ${EventType.SUBSTITUTION}.`);
  }

  if (tip === EventType.SHOT) {
    return {
      ...osnova,
      tip,
      poeni: procitajPoene(redak),
      pogodak: procitajLogickuVrijednost(obavezanTekst(redak, 8, "pogodak"), "pogodak")
    };
  }

  if (tip === EventType.SUBSTITUTION) {
    return { ...osnova, tip, smjer: procitajSmjer(obavezanTekst(redak, 9, "smjer")) };
  }

  return { ...osnova, tip };
}

function procitajRedak(redak: RedakCsv, skup: SkupRedaka): void {
  switch (dohvatiCeliju(redak, 0).toUpperCase()) {
    case VRSTA_ZAGLAVLJA:
      return;
    case VRSTA_UTAKMICE:
      skup.odigranoU = obavezanTekst(redak, 1, "playedAt");
      return;
    case VRSTA_TIMA:
      skup.timovi.push(procitajTim(redak));
      return;
    case VRSTA_IGRACA:
      skup.igraci.push(procitajIgraca(redak));
      return;
    case VRSTA_PETORKE:
      skup.petorke.push(procitajPetorku(redak));
      return;
    case VRSTA_DOGADJAJA:
      skup.dogadjaji.push(procitajDogadjaj(redak));
      return;
    default:
      throw new Error(
        `Nepoznata vrsta retka. Dopuštene su: ${[VRSTA_UTAKMICE, VRSTA_TIMA, VRSTA_IGRACA, VRSTA_PETORKE, VRSTA_DOGADJAJA].join(", ")}.`
      );
  }
}

export function procitajUtakmicu(tekst: string): IshodCitanja {
  const skup: SkupRedaka = { odigranoU: null, timovi: [], igraci: [], petorke: [], dogadjaji: [] };
  const pogreske: PogreskaUvoza[] = [];

  for (const redak of procitajCsv(tekst)) {
    try {
      procitajRedak(redak, skup);
    } catch (pogreska) {
      pogreske.push({
        redak: redak.redak,
        poruka: pogreska instanceof Error ? pogreska.message : "Redak se ne može pročitati."
      });
    }
  }

  return {
    utakmica: {
      odigranoU: skup.odigranoU,
      timovi: skup.timovi,
      igraci: skup.igraci,
      petorke: skup.petorke,
      dogadjaji: skup.dogadjaji
    },
    pogreske
  };
}
