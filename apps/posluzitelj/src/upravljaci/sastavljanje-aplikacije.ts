import express from "express";
import type { Express, RequestHandler } from "express";

import type { Servisi } from "../sastavljanje-servisa.js";
import { UpravljacAnalitike } from "./upravljac-analitike.js";
import { pripremiUsmjerivacKlijenta } from "./posluzivanje-klijenta.js";
import { UpravljacUtakmica } from "./upravljac-utakmica.js";
import { UpravljacUvoza } from "./upravljac-uvoza.js";
import { UpravljacIgraca } from "./upravljac-igraca.js";
import { UpravljacTimova } from "./upravljac-timova.js";
import { pretvoriPogreskuUOdgovor } from "./medjusloj-pogresaka.js";

const nepoznataRuta: RequestHandler = (request, response) => {
  response.status(404).json({ poruka: `Ruta ${request.method} ${request.originalUrl} ne postoji.` });
};

export function pripremiAplikaciju(servisi: Servisi, putanjaKlijenta?: string): Express {
  const app = express();

  app.use(express.json({ limit: "1mb" }));

  app.use("/api/teams", new UpravljacTimova(servisi.maticniPodaci).pripremiUsmjerivac());
  app.use("/api/players", new UpravljacIgraca(servisi.maticniPodaci).pripremiUsmjerivac());
  app.use("/api/games", new UpravljacUvoza(servisi.uvoz).pripremiUsmjerivac());
  app.use("/api/games", new UpravljacUtakmica(servisi.utakmice).pripremiUsmjerivac());
  app.use("/api/games", new UpravljacAnalitike(servisi.analitika).pripremiUsmjerivac());

  app.use("/api", nepoznataRuta);

  if (putanjaKlijenta !== undefined) {
    app.use(pripremiUsmjerivacKlijenta(putanjaKlijenta));
  }

  app.use(nepoznataRuta);
  app.use(pretvoriPogreskuUOdgovor);

  return app;
}
