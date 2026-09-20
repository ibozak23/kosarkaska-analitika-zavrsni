import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";

import { SQL_SHEME } from "./shema.js";

export const U_MEMORIJI = ":memory:";

const ZADANA_PUTANJA = "podaci/analitika.db";

export function dohvatiPutanjuBaze(): string {
  return process.env["DATABASE_PATH"] ?? ZADANA_PUTANJA;
}

export function otvoriBazu(putanja: string): Database.Database {
  if (putanja !== U_MEMORIJI) {
    mkdirSync(dirname(putanja), { recursive: true });
  }

  const baza = new Database(putanja);
  baza.pragma("foreign_keys = ON");
  baza.exec(SQL_SHEME);

  return baza;
}

export type PokretacTransakcije = <TIshod>(posao: () => TIshod) => TIshod;

export function pripremiPokretacTransakcije(baza: Database.Database): PokretacTransakcije {
  return <TIshod>(posao: () => TIshod): TIshod => baza.transaction(posao)();
}
