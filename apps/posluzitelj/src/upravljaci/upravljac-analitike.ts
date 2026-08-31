import express from "express";
import type { Router } from "express";

import type { ServisAnalitike } from "../servisi/servis-analitike.js";
import { dohvatiOznaku } from "./citanje-zahtjeva.js";
import { oblikujSazetakUtakmice, oblikujPokazateljeIgraca, oblikujPokazateljeTima } from "./oblikovanje-odgovora.js";

export class UpravljacAnalitike {
  readonly #analitika: ServisAnalitike;

  constructor(analitika: ServisAnalitike) {
    this.#analitika = analitika;
  }

  pripremiUsmjerivac(): Router {
    const usmjerivac = express.Router();

    usmjerivac.get("/:id/box-score", (request, response) => {
      const gameId = dohvatiOznaku(request.params.id, "utakmice");

      response.json(oblikujSazetakUtakmice(this.#analitika.izracunajSazetakUtakmice(gameId)));
    });

    usmjerivac.get("/:id/players/:playerId/stats", (request, response) => {
      const gameId = dohvatiOznaku(request.params.id, "utakmice");
      const playerId = dohvatiOznaku(request.params.playerId, "igrača");

      response.json(oblikujPokazateljeIgraca(this.#analitika.izracunajPokazateljeIgraca(gameId, playerId)));
    });

    usmjerivac.get("/:id/teams/:teamId/stats", (request, response) => {
      const gameId = dohvatiOznaku(request.params.id, "utakmice");
      const teamId = dohvatiOznaku(request.params.teamId, "tima");

      response.json(oblikujPokazateljeTima(this.#analitika.izracunajPokazateljeTima(gameId, teamId)));
    });

    return usmjerivac;
  }
}
