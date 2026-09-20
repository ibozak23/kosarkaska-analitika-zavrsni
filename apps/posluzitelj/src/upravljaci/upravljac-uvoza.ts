import express from "express";
import type { Router } from "express";
import { EventType, Position, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";

import { STRANE_UTAKMICE } from "../servisi/servis-uvoza-utakmice.js";
import type {
  ServisUvozaUtakmice,
  UvozDogadjaja,
  UvozIgraca,
  UvozStrane,
  UvozTima,
  UvozUtakmice
} from "../servisi/servis-uvoza-utakmice.js";
import {
  dohvatiCijeliBroj,
  dohvatiNeobavezniCijeliBroj,
  dohvatiNeobavezniTekst,
  dohvatiNizCijelihBrojeva,
  dohvatiNizZapisa,
  dohvatiTekst,
  dohvatiVrijednostNabrajanja,
  dohvatiZapis
} from "./citanje-zahtjeva.js";

function dohvatiTimUvoza(izvor: Record<string, unknown>): UvozTima {
  return {
    name: dohvatiTekst(izvor, "name"),
    city: dohvatiNeobavezniTekst(izvor, "city"),
    league: dohvatiNeobavezniTekst(izvor, "league"),
    season: dohvatiNeobavezniTekst(izvor, "season")
  };
}

function dohvatiIgracaUvoza(izvor: Record<string, unknown>): UvozIgraca {
  return {
    jerseyNumber: dohvatiCijeliBroj(izvor, "jerseyNumber"),
    firstName: dohvatiTekst(izvor, "firstName"),
    lastName: dohvatiTekst(izvor, "lastName"),
    position: dohvatiVrijednostNabrajanja(izvor, "position", Object.values(Position)),
    heightCm: dohvatiNeobavezniCijeliBroj(izvor, "heightCm")
  };
}

function dohvatiStranuUvoza(izvor: Record<string, unknown>, kljuc: string): UvozStrane {
  const strana = dohvatiZapis(izvor[kljuc]);

  return {
    team: dohvatiTimUvoza(dohvatiZapis(strana["team"])),
    players: dohvatiNizZapisa(strana, "players").map(dohvatiIgracaUvoza),
    starters: dohvatiNizCijelihBrojeva(strana, "starters")
  };
}

function dohvatiDogadjajUvoza(izvor: Record<string, unknown>): UvozDogadjaja {
  const osnova = {
    side: dohvatiVrijednostNabrajanja(izvor, "side", STRANE_UTAKMICE),
    jerseyNumber: dohvatiCijeliBroj(izvor, "jerseyNumber"),
    quarter: dohvatiCijeliBroj(izvor, "quarter"),
    minute: dohvatiCijeliBroj(izvor, "minute"),
    second: dohvatiCijeliBroj(izvor, "second")
  };

  const type = dohvatiVrijednostNabrajanja(izvor, "type", Object.values(EventType));

  switch (type) {
    case EventType.SHOT:
      return {
        ...osnova,
        type,
        points: dohvatiCijeliBroj(izvor, "points") as 1 | 2 | 3,
        made: izvor["made"] === true
      };
    case EventType.SUBSTITUTION:
      return {
        ...osnova,
        type,
        direction: dohvatiVrijednostNabrajanja(izvor, "direction", Object.values(SubstitutionDirection))
      };
    default:
      return { ...osnova, type };
  }
}

function dohvatiUvozUtakmice(tijelo: unknown): UvozUtakmice {
  const izvor = dohvatiZapis(tijelo);

  return {
    playedAt: new Date(dohvatiTekst(izvor, "playedAt")),
    home: dohvatiStranuUvoza(izvor, "home"),
    away: dohvatiStranuUvoza(izvor, "away"),
    events: dohvatiNizZapisa(izvor, "events").map(dohvatiDogadjajUvoza)
  };
}

export class UpravljacUvoza {
  readonly #uvoz: ServisUvozaUtakmice;

  constructor(uvoz: ServisUvozaUtakmice) {
    this.#uvoz = uvoz;
  }

  pripremiUsmjerivac(): Router {
    const usmjerivac = express.Router();

    usmjerivac.post("/import", (request, response) => {
      response.status(201).json(this.#uvoz.uveziUtakmicu(dohvatiUvozUtakmice(request.body)));
    });

    return usmjerivac;
  }
}
