import type Database from "better-sqlite3";
import type { LeagueConstants } from "@ibozak23/kosarkaska-analitika";

import { pripremiPokretacTransakcije } from "./baza/veza-s-bazom.js";
import { RepozitorijDogadjaja } from "./repozitoriji/repozitorij-dogadjaja.js";
import { RepozitorijUtakmica } from "./repozitoriji/repozitorij-utakmica.js";
import { RepozitorijIgraca } from "./repozitoriji/repozitorij-igraca.js";
import { RepozitorijTimova } from "./repozitoriji/repozitorij-timova.js";
import { ServisAnalitike } from "./servisi/servis-analitike.js";
import { ServisUtakmica } from "./servisi/servis-utakmica.js";
import { ServisMaticnihPodataka } from "./servisi/servis-maticnih-podataka.js";
import { ServisUvozaUtakmice } from "./servisi/servis-uvoza-utakmice.js";

export interface Servisi {
  readonly maticniPodaci: ServisMaticnihPodataka;
  readonly utakmice: ServisUtakmica;
  readonly analitika: ServisAnalitike;
  readonly uvoz: ServisUvozaUtakmice;
}

export function pripremiServise(baza: Database.Database, league: LeagueConstants): Servisi {
  const timovi = new RepozitorijTimova(baza);
  const players = new RepozitorijIgraca(baza);
  const utakmice = new RepozitorijUtakmica(baza);
  const dogadjaji = new RepozitorijDogadjaja(baza);

  const servisMaticnihPodataka = new ServisMaticnihPodataka(timovi, players, dogadjaji);
  const servisUtakmica = new ServisUtakmica(utakmice, dogadjaji, players);

  return {
    maticniPodaci: servisMaticnihPodataka,
    utakmice: servisUtakmica,
    analitika: new ServisAnalitike(utakmice, timovi, players, dogadjaji, league),
    uvoz: new ServisUvozaUtakmice(servisMaticnihPodataka, servisUtakmica, pripremiPokretacTransakcije(baza))
  };
}
