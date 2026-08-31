import type Database from "better-sqlite3";
import type { LeagueConstants } from "@ibozak23/kosarkaska-analitika";

import { RepozitorijDogadjaja } from "./repozitoriji/repozitorij-dogadjaja.js";
import { RepozitorijUtakmica } from "./repozitoriji/repozitorij-utakmica.js";
import { RepozitorijIgraca } from "./repozitoriji/repozitorij-igraca.js";
import { RepozitorijTimova } from "./repozitoriji/repozitorij-timova.js";
import { ServisAnalitike } from "./servisi/servis-analitike.js";
import { ServisUtakmica } from "./servisi/servis-utakmica.js";
import { ServisMaticnihPodataka } from "./servisi/servis-maticnih-podataka.js";

export interface Servisi {
  readonly maticniPodaci: ServisMaticnihPodataka;
  readonly utakmice: ServisUtakmica;
  readonly analitika: ServisAnalitike;
}

export function pripremiServise(baza: Database.Database, league: LeagueConstants): Servisi {
  const timovi = new RepozitorijTimova(baza);
  const players = new RepozitorijIgraca(baza);
  const utakmice = new RepozitorijUtakmica(baza);
  const dogadjaji = new RepozitorijDogadjaja(baza);

  return {
    maticniPodaci: new ServisMaticnihPodataka(timovi, players, dogadjaji),
    utakmice: new ServisUtakmica(utakmice, dogadjaji, players),
    analitika: new ServisAnalitike(utakmice, timovi, players, dogadjaji, league)
  };
}
