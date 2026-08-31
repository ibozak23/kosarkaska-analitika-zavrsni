import express from "express";
import type { Router } from "express";
import { Position } from "@ibozak23/kosarkaska-analitika";

import type { IgracZaUpis } from "../repozitoriji/repozitorij-igraca.js";
import type { ServisMaticnihPodataka } from "../servisi/servis-maticnih-podataka.js";
import { dohvatiVrijednostNabrajanja, dohvatiOznaku, dohvatiCijeliBroj, dohvatiNeobavezniCijeliBroj, dohvatiZapis, dohvatiTekst } from "./citanje-zahtjeva.js";

function dohvatiIgracaZaUpis(tijelo: unknown): IgracZaUpis {
  const izvor = dohvatiZapis(tijelo);

  return {
    firstName: dohvatiTekst(izvor, "firstName"),
    lastName: dohvatiTekst(izvor, "lastName"),
    position: dohvatiVrijednostNabrajanja(izvor, "position", Object.values(Position)),
    heightCm: dohvatiNeobavezniCijeliBroj(izvor, "heightCm"),
    jerseyNumber: dohvatiNeobavezniCijeliBroj(izvor, "jerseyNumber"),
    teamId: dohvatiCijeliBroj(izvor, "teamId")
  };
}

export class UpravljacIgraca {
  readonly #maticniPodaci: ServisMaticnihPodataka;

  constructor(maticniPodaci: ServisMaticnihPodataka) {
    this.#maticniPodaci = maticniPodaci;
  }

  pripremiUsmjerivac(): Router {
    const usmjerivac = express.Router();

    usmjerivac.get("/", (_request, response) => {
      response.json(this.#maticniPodaci.dohvatiIgrace());
    });

    usmjerivac.get("/:id", (request, response) => {
      response.json(this.#maticniPodaci.dohvatiIgraca(dohvatiOznaku(request.params.id, "igrača")));
    });

    usmjerivac.post("/", (request, response) => {
      response.status(201).json(this.#maticniPodaci.spremiIgraca(dohvatiIgracaZaUpis(request.body)));
    });

    usmjerivac.put("/:id", (request, response) => {
      const id = dohvatiOznaku(request.params.id, "igrača");

      response.json(this.#maticniPodaci.izmijeniIgraca(id, dohvatiIgracaZaUpis(request.body)));
    });

    usmjerivac.delete("/:id", (request, response) => {
      this.#maticniPodaci.obrisiIgraca(dohvatiOznaku(request.params.id, "igrača"));
      response.status(204).end();
    });

    return usmjerivac;
  }
}
