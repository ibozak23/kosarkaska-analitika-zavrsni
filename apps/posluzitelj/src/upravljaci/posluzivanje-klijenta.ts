import { join, resolve } from "node:path";

import express from "express";
import type { Router } from "express";

const PUTANJA_IZGRADNJE_KLIJENTA = "../klijent/dist/browser";

export function dohvatiPutanjuKlijenta(): string {
  return resolve(PUTANJA_IZGRADNJE_KLIJENTA);
}

export function pripremiUsmjerivacKlijenta(putanja: string): Router {
  const usmjerivac = express.Router();

  usmjerivac.use(express.static(putanja, { index: false }));
  usmjerivac.get(/.*/, (_request, response) => {
    response.sendFile(join(putanja, "index.html"));
  });

  return usmjerivac;
}
