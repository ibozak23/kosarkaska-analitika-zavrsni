import { HttpErrorResponse } from "@angular/common/http";
import type { HttpClient } from "@angular/common/http";
import { EventType } from "@ibozak23/kosarkaska-analitika";
import { of, throwError } from "rxjs";
import type { Observable } from "rxjs";
import { describe, expect, it } from "vitest";

import { ServisSuceljaRest } from "../src/app/servisi/servis-sucelja-rest.js";

interface Poziv {
  readonly method: string;
  readonly url: string;
  readonly body: unknown;
}

function pripremiServis(ishod: Observable<unknown>): { servis: ServisSuceljaRest; pozivi: Poziv[] } {
  const pozivi: Poziv[] = [];
  const zabiljezi =
    (metoda: string) =>
    (adresa: string, tijelo?: unknown): Observable<unknown> => {
      pozivi.push({ method: metoda, url: adresa, body: tijelo ?? null });
      return ishod;
    };
  const lazniHttp = {
    get: zabiljezi("GET"),
    post: zabiljezi("POST"),
    put: zabiljezi("PUT"),
    delete: zabiljezi("DELETE")
  };

  return { servis: new ServisSuceljaRest(lazniHttp as unknown as HttpClient), pozivi };
}

function pripremiPogreskuZahtjeva(stanje: number, tijelo: unknown): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status: stanje, error: tijelo }));
}

describe("ServisSuceljaRest", () => {
  it("dohvaća popis timova s adrese /api/teams", async () => {
    const timovi = [{ id: 1, name: "Varaždin", city: null, league: null, season: null }];
    const { servis, pozivi } = pripremiServis(of(timovi));

    expect(await servis.dohvatiTimove()).toEqual(timovi);
    expect(pozivi).toEqual([{ method: "GET", url: "/api/teams", body: null }]);
  });

  it("gradi adresu pokazatelja igrača iz oznaka utakmice i igrača", async () => {
    const { servis, pozivi } = pripremiServis(of({ playerId: 7 }));

    await servis.dohvatiPokazateljeIgraca(1, 7);

    expect(pozivi[0]?.url).toBe("/api/games/1/players/7/stats");
  });

  it("gradi adresu timskih pokazatelja iz oznaka utakmice i tima", async () => {
    const { servis, pozivi } = pripremiServis(of({ teamId: 2 }));

    await servis.dohvatiPokazateljeTima(4, 2);

    expect(pozivi[0]?.url).toBe("/api/games/4/teams/2/stats");
  });

  it("šalje događaj sa svim poljima svoje vrste", async () => {
    const { servis, pozivi } = pripremiServis(of({ id: 11 }));
    const sut = {
      type: EventType.SHOT,
      playerId: 1,
      teamId: 1,
      quarter: 1,
      minute: 7,
      second: 46,
      points: 3,
      made: true
    } as const;

    await servis.spremiDogadjaj(3, sut);

    expect(pozivi[0]).toEqual({ method: "POST", url: "/api/games/3/events", body: sut });
  });

  it("prenosi poruku poslužitelja iz polja poruka", async () => {
    const { servis } = pripremiServis(pripremiPogreskuZahtjeva(400, { poruka: "Utakmica još nije počela." }));

    await expect(servis.dohvatiSazetakUtakmice(1)).rejects.toThrow("Utakmica još nije počela.");
  });

  it("javlja nedostupan poslužitelj kad odgovora nema", async () => {
    const { servis } = pripremiServis(pripremiPogreskuZahtjeva(0, null));

    await expect(servis.dohvatiTimove()).rejects.toThrow("Poslužitelj nije dostupan.");
  });
});
