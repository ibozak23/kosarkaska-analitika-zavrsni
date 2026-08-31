import express from "express";
import type { Router } from "express";

import type { ServisMaticnihPodataka } from "../servisi/servis-maticnih-podataka.js";
import type { TimZaUpis } from "../repozitoriji/repozitorij-timova.js";
import { dohvatiOznaku, dohvatiNeobavezniTekst, dohvatiZapis, dohvatiTekst } from "./citanje-zahtjeva.js";

function dohvatiTimZaUpis(tijelo: unknown): TimZaUpis {
  const izvor = dohvatiZapis(tijelo);

  return {
    name: dohvatiTekst(izvor, "name"),
    city: dohvatiNeobavezniTekst(izvor, "city"),
    league: dohvatiNeobavezniTekst(izvor, "league"),
    season: dohvatiNeobavezniTekst(izvor, "season")
  };
}

export class UpravljacTimova {
  readonly #maticniPodaci: ServisMaticnihPodataka;

  constructor(maticniPodaci: ServisMaticnihPodataka) {
    this.#maticniPodaci = maticniPodaci;
  }

  pripremiUsmjerivac(): Router {
    const usmjerivac = express.Router();

    usmjerivac.get("/", (_request, response) => {
      response.json(this.#maticniPodaci.dohvatiTimove());
    });

    usmjerivac.get("/:id", (request, response) => {
      response.json(this.#maticniPodaci.dohvatiTim(dohvatiOznaku(request.params.id, "tima")));
    });

    usmjerivac.get("/:id/players", (request, response) => {
      response.json(this.#maticniPodaci.dohvatiIgraceTima(dohvatiOznaku(request.params.id, "tima")));
    });

    usmjerivac.post("/", (request, response) => {
      response.status(201).json(this.#maticniPodaci.spremiTim(dohvatiTimZaUpis(request.body)));
    });

    usmjerivac.put("/:id", (request, response) => {
      const id = dohvatiOznaku(request.params.id, "tima");

      response.json(this.#maticniPodaci.izmijeniTim(id, dohvatiTimZaUpis(request.body)));
    });

    usmjerivac.delete("/:id", (request, response) => {
      this.#maticniPodaci.obrisiTim(dohvatiOznaku(request.params.id, "tima"));
      response.status(204).end();
    });

    return usmjerivac;
  }
}
