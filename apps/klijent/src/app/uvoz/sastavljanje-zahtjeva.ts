import { EventType } from "@ibozak23/kosarkaska-analitika";

import type {
  StranaUvoza,
  ZahtjevZaDogadjajUvoza,
  ZahtjevZaIgracaUvoza,
  ZahtjevZaStranuUvoza,
  ZahtjevZaUvozUtakmice
} from "../servisi/tipovi-sucelja-rest.js";
import type { StranaUtakmice, UvezenaUtakmica, UvezeniDogadjaj } from "./model-uvoza.js";

function pretvoriStranu(strana: StranaUtakmice): StranaUvoza {
  return strana === "DOMACI" ? "HOME" : "AWAY";
}

function sastaviIgrace(utakmica: UvezenaUtakmica, strana: StranaUtakmice): ZahtjevZaIgracaUvoza[] {
  return utakmica.igraci
    .filter((igrac) => igrac.strana === strana)
    .map((igrac) => ({
      jerseyNumber: igrac.dres,
      firstName: igrac.ime,
      lastName: igrac.prezime,
      position: igrac.pozicija,
      heightCm: igrac.visina
    }));
}

function sastaviStranu(utakmica: UvezenaUtakmica, strana: StranaUtakmice): ZahtjevZaStranuUvoza {
  const tim = utakmica.timovi.find((kandidat) => kandidat.strana === strana);
  const petorka = utakmica.petorke.find((kandidat) => kandidat.strana === strana);

  if (tim === undefined || petorka === undefined) {
    throw new Error(`Datoteka nema potpune podatke za stranu ${strana}.`);
  }

  return {
    team: { name: tim.naziv, city: tim.grad, league: tim.liga, season: tim.sezona },
    players: sastaviIgrace(utakmica, strana),
    starters: petorka.dresovi
  };
}

function sastaviDogadjaj(dogadjaj: UvezeniDogadjaj): ZahtjevZaDogadjajUvoza {
  const osnova = {
    side: pretvoriStranu(dogadjaj.strana),
    jerseyNumber: dogadjaj.dres,
    quarter: dogadjaj.cetvrtina,
    minute: dogadjaj.minuta,
    second: dogadjaj.sekunda
  };

  switch (dogadjaj.tip) {
    case EventType.SHOT:
      return { ...osnova, type: dogadjaj.tip, points: dogadjaj.poeni, made: dogadjaj.pogodak };
    case EventType.SUBSTITUTION:
      return { ...osnova, type: dogadjaj.tip, direction: dogadjaj.smjer };
    default:
      return { ...osnova, type: dogadjaj.tip };
  }
}

export function sastaviZahtjevUvoza(utakmica: UvezenaUtakmica): ZahtjevZaUvozUtakmice {
  if (utakmica.odigranoU === null) {
    throw new Error("Datoteka nema redak UTAKMICA s datumom i vremenom.");
  }

  return {
    playedAt: new Date(utakmica.odigranoU).toISOString(),
    home: sastaviStranu(utakmica, "DOMACI"),
    away: sastaviStranu(utakmica, "GOSTI"),
    events: utakmica.dogadjaji.map(sastaviDogadjaj)
  };
}
