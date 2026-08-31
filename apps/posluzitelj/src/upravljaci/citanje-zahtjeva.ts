import { PogreskaProvjere } from "../pogreske/pogreske.js";

export function dohvatiZapis(tijelo: unknown): Record<string, unknown> {
  if (typeof tijelo !== "object" || tijelo === null || Array.isArray(tijelo)) {
    throw new PogreskaProvjere("Tijelo zahtjeva mora biti JSON objekt.");
  }

  return tijelo as Record<string, unknown>;
}

export function dohvatiTekst(izvor: Record<string, unknown>, kljuc: string): string {
  const vrijednost = izvor[kljuc];

  if (typeof vrijednost !== "string") {
    throw new PogreskaProvjere(`Polje ${kljuc} mora biti niz znakova.`);
  }

  return vrijednost;
}

export function dohvatiCijeliBroj(izvor: Record<string, unknown>, kljuc: string): number {
  const vrijednost = izvor[kljuc];

  if (typeof vrijednost !== "number") {
    throw new PogreskaProvjere(`Polje ${kljuc} mora biti broj.`);
  }

  return vrijednost;
}

export function dohvatiNeobavezniTekst(izvor: Record<string, unknown>, kljuc: string): string | null {
  const vrijednost = izvor[kljuc];

  return typeof vrijednost === "string" ? vrijednost : null;
}

export function dohvatiNeobavezniCijeliBroj(izvor: Record<string, unknown>, kljuc: string): number | null {
  const vrijednost = izvor[kljuc];

  return typeof vrijednost === "number" ? vrijednost : null;
}

export function dohvatiVrijednostNabrajanja<TValue extends string>(
  izvor: Record<string, unknown>,
  kljuc: string,
  allowed: readonly TValue[]
): TValue {
  const vrijednost = dohvatiTekst(izvor, kljuc);

  for (const kandidat of allowed) {
    if (kandidat === vrijednost) {
      return kandidat;
    }
  }

  throw new PogreskaProvjere(`Polje ${kljuc} mora biti jedna od vrijednosti: ${allowed.join(", ")}.`);
}

export function dohvatiNizCijelihBrojeva(izvor: Record<string, unknown>, kljuc: string): number[] {
  const vrijednost = izvor[kljuc];

  if (!Array.isArray(vrijednost)) {
    throw new PogreskaProvjere(`Polje ${kljuc} mora biti popis cijelih brojeva.`);
  }

  return vrijednost as number[];
}

export function dohvatiOznaku(vrijednost: string | undefined, imeOznake: string): number {
  const broj = Number(vrijednost);

  if (!Number.isInteger(broj) || broj <= 0) {
    throw new PogreskaProvjere(`Oznaka ${imeOznake} mora biti cijeli broj veći od nule.`);
  }

  return broj;
}
