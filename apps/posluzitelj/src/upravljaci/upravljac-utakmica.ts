import express from "express";
import type { Router } from "express";
import { EventType, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";

import type { DogadjajZaUpis } from "../repozitoriji/preslikivac-dogadjaja.js";
import type { PrijavaUtakmice, ServisUtakmica } from "../servisi/servis-utakmica.js";
import { dohvatiVrijednostNabrajanja, dohvatiOznaku, dohvatiCijeliBroj, dohvatiNizCijelihBrojeva, dohvatiZapis, dohvatiTekst } from "./citanje-zahtjeva.js";

function dohvatiPrijavuUtakmice(tijelo: unknown): PrijavaUtakmice {
  const izvor = dohvatiZapis(tijelo);

  return {
    playedAt: new Date(dohvatiTekst(izvor, "playedAt")),
    homeTeamId: dohvatiCijeliBroj(izvor, "homeTeamId"),
    awayTeamId: dohvatiCijeliBroj(izvor, "awayTeamId"),
    homeStarters: dohvatiNizCijelihBrojeva(izvor, "homeStarters"),
    awayStarters: dohvatiNizCijelihBrojeva(izvor, "awayStarters")
  };
}

function dohvatiDogadjajZaUpis(gameId: number, tijelo: unknown): DogadjajZaUpis {
  const izvor = dohvatiZapis(tijelo);
  const base = {
    gameId,
    playerId: dohvatiCijeliBroj(izvor, "playerId"),
    teamId: dohvatiCijeliBroj(izvor, "teamId"),
    quarter: dohvatiCijeliBroj(izvor, "quarter"),
    minute: dohvatiCijeliBroj(izvor, "minute"),
    second: dohvatiCijeliBroj(izvor, "second")
  };

  const type = dohvatiVrijednostNabrajanja(izvor, "type", Object.values(EventType));

  switch (type) {
    case EventType.SHOT:
      return {
        ...base,
        type,
        points: dohvatiCijeliBroj(izvor, "points") as 1 | 2 | 3,
        made: izvor["made"] === true
      };
    case EventType.SUBSTITUTION:
      return {
        ...base,
        type,
        direction: dohvatiVrijednostNabrajanja(izvor, "direction", Object.values(SubstitutionDirection))
      };
    default:
      return { ...base, type };
  }
}

export class UpravljacUtakmica {
  readonly #utakmice: ServisUtakmica;

  constructor(utakmice: ServisUtakmica) {
    this.#utakmice = utakmice;
  }

  pripremiUsmjerivac(): Router {
    const usmjerivac = express.Router();

    usmjerivac.get("/", (_request, response) => {
      response.json(this.#utakmice.dohvatiUtakmice());
    });

    usmjerivac.get("/:id", (request, response) => {
      response.json(this.#utakmice.dohvatiUtakmicu(dohvatiOznaku(request.params.id, "utakmice")));
    });

    usmjerivac.post("/", (request, response) => {
      response.status(201).json(this.#utakmice.spremiPrijavuUtakmice(dohvatiPrijavuUtakmice(request.body)));
    });

    usmjerivac.get("/:id/events", (request, response) => {
      response.json(this.#utakmice.dohvatiDogadjaje(dohvatiOznaku(request.params.id, "utakmice")));
    });

    usmjerivac.post("/:id/events", (request, response) => {
      const gameId = dohvatiOznaku(request.params.id, "utakmice");

      response.status(201).json(this.#utakmice.spremiDogadjaj(gameId, dohvatiDogadjajZaUpis(gameId, request.body)));
    });

    usmjerivac.post("/:id/finish", (request, response) => {
      response.json(this.#utakmice.izmijeniUtakmicuUZavrsenu(dohvatiOznaku(request.params.id, "utakmice")));
    });

    return usmjerivac;
  }
}
