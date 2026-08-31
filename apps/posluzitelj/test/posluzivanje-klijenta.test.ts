import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { Express } from "express";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { pripremiServise } from "../src/sastavljanje-servisa.js";
import { U_MEMORIJI, otvoriBazu } from "../src/baza/veza-s-bazom.js";
import { DEMONSTRACIJSKE_LIGASKE_KONSTANTE } from "../src/konfiguracija/ligaske-konstante.js";
import { pripremiAplikaciju } from "../src/upravljaci/sastavljanje-aplikacije.js";

const SADRZAJ_STRANICE = "<!doctype html><html lang=\"hr\"><body><app-root></app-root></body></html>";

function izgradnjaKlijenta(): string {
  const putanja = mkdtempSync(join(tmpdir(), "klijent-"));

  writeFileSync(join(putanja, "index.html"), SADRZAJ_STRANICE);
  writeFileSync(join(putanja, "main-ABCDEFGH.js"), "console.log('klijent');");

  return putanja;
}

describe("posluživanje klijentske aplikacije s iste adrese", () => {
  let aplikacija: Express;
  let putanjaKlijenta: string;

  beforeAll(() => {
    putanjaKlijenta = izgradnjaKlijenta();
    aplikacija = pripremiAplikaciju(pripremiServise(otvoriBazu(U_MEMORIJI), DEMONSTRACIJSKE_LIGASKE_KONSTANTE), putanjaKlijenta);
  });

  it("na korijenskoj putanji vraća stranicu klijenta", async () => {
    const odgovor = await request(aplikacija).get("/").expect(200);

    expect(odgovor.headers["content-type"]).toContain("text/html");
    expect(odgovor.text).toBe(SADRZAJ_STRANICE);
  });

  it("putanju usmjeravanja klijenta vraća kao istu stranicu", async () => {
    for (const putanja of ["/timovi", "/utakmice/1/analitika"]) {
      const odgovor = await request(aplikacija).get(putanja).expect(200);

      expect(odgovor.text).toBe(SADRZAJ_STRANICE);
    }
  });

  it("poslužuje datoteke izgradnje s njihovim izvornim sadržajem", async () => {
    const odgovor = await request(aplikacija).get("/main-ABCDEFGH.js").expect(200);

    expect(odgovor.headers["content-type"]).toContain("javascript");
  });

  it("zadržava sučelje REST na predmetku /api", async () => {
    const odgovor = await request(aplikacija).get("/api/teams").expect(200);

    expect(odgovor.body).toEqual([]);
  });

  it("za nepoznatu rutu sučelja REST i dalje vraća zapis JSON, a ne stranicu", async () => {
    const odgovor = await request(aplikacija).get("/api/nepostojece").expect(404);

    expect(odgovor.body).toEqual({ poruka: "Ruta GET /api/nepostojece ne postoji." });
  });

  it("za zahtjev koji nije GET vraća zapis JSON", async () => {
    const odgovor = await request(aplikacija).post("/timovi").expect(404);

    expect(odgovor.body).toEqual({ poruka: "Ruta POST /timovi ne postoji." });
  });
});
