
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { GameEvent, Player, Team } from "@ibozak23/kosarkaska-analitika";
import { firstValueFrom } from "rxjs";
import type { Observable } from "rxjs";

import type {
  ZahtjevZaDogadjaj,
  ZahtjevZaPrijavuUtakmice,
  OdgovorUtakmice,
  OdgovorSazetkaUtakmice,
  ZahtjevZaIgraca,
  OdgovorPokazateljaIgraca,
  ZahtjevZaTim,
  OdgovorPokazateljaTima
} from "./tipovi-sucelja-rest.js";

const PREDMETAK_API = "/api";

function dohvatiPorukuPogreske(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return "Neočekivana pogreška u klijentskoj aplikaciji.";
  }

  const body: unknown = error.error;

  if (typeof body === "object" && body !== null && "poruka" in body) {
    return String(body.poruka);
  }

  return "Poslužitelj nije dostupan.";
}

@Injectable({ providedIn: "root" })
export class ServisSuceljaRest {

  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  dohvatiTimove(): Promise<readonly Team[]> {
    return this.#posaljiZahtjev(this.#http.get<readonly Team[]>(`${PREDMETAK_API}/teams`));
  }

  dohvatiTim(teamId: number): Promise<Team> {
    return this.#posaljiZahtjev(this.#http.get<Team>(`${PREDMETAK_API}/teams/${String(teamId)}`));
  }

  dohvatiIgraceTima(teamId: number): Promise<readonly Player[]> {
    return this.#posaljiZahtjev(this.#http.get<readonly Player[]>(`${PREDMETAK_API}/teams/${String(teamId)}/players`));
  }

  spremiTim(input: ZahtjevZaTim): Promise<Team> {
    return this.#posaljiZahtjev(this.#http.post<Team>(`${PREDMETAK_API}/teams`, input));
  }

  izmijeniTim(teamId: number, input: ZahtjevZaTim): Promise<Team> {
    return this.#posaljiZahtjev(this.#http.put<Team>(`${PREDMETAK_API}/teams/${String(teamId)}`, input));
  }

  obrisiTim(teamId: number): Promise<void> {
    return this.#posaljiZahtjev(this.#http.delete<void>(`${PREDMETAK_API}/teams/${String(teamId)}`));
  }

  dohvatiIgrace(): Promise<readonly Player[]> {
    return this.#posaljiZahtjev(this.#http.get<readonly Player[]>(`${PREDMETAK_API}/players`));
  }

  spremiIgraca(input: ZahtjevZaIgraca): Promise<Player> {
    return this.#posaljiZahtjev(this.#http.post<Player>(`${PREDMETAK_API}/players`, input));
  }

  izmijeniIgraca(playerId: number, input: ZahtjevZaIgraca): Promise<Player> {
    return this.#posaljiZahtjev(this.#http.put<Player>(`${PREDMETAK_API}/players/${String(playerId)}`, input));
  }

  obrisiIgraca(playerId: number): Promise<void> {
    return this.#posaljiZahtjev(this.#http.delete<void>(`${PREDMETAK_API}/players/${String(playerId)}`));
  }

  dohvatiUtakmice(): Promise<readonly OdgovorUtakmice[]> {
    return this.#posaljiZahtjev(this.#http.get<readonly OdgovorUtakmice[]>(`${PREDMETAK_API}/games`));
  }

  dohvatiUtakmicu(gameId: number): Promise<OdgovorUtakmice> {
    return this.#posaljiZahtjev(this.#http.get<OdgovorUtakmice>(`${PREDMETAK_API}/games/${String(gameId)}`));
  }

  spremiPrijavuUtakmice(input: ZahtjevZaPrijavuUtakmice): Promise<OdgovorUtakmice> {
    return this.#posaljiZahtjev(this.#http.post<OdgovorUtakmice>(`${PREDMETAK_API}/games`, input));
  }

  izmijeniUtakmicuUZavrsenu(gameId: number): Promise<OdgovorUtakmice> {
    return this.#posaljiZahtjev(this.#http.post<OdgovorUtakmice>(`${PREDMETAK_API}/games/${String(gameId)}/finish`, {}));
  }

  dohvatiDogadjaje(gameId: number): Promise<readonly GameEvent[]> {
    return this.#posaljiZahtjev(this.#http.get<readonly GameEvent[]>(`${PREDMETAK_API}/games/${String(gameId)}/events`));
  }

  spremiDogadjaj(gameId: number, input: ZahtjevZaDogadjaj): Promise<GameEvent> {
    return this.#posaljiZahtjev(this.#http.post<GameEvent>(`${PREDMETAK_API}/games/${String(gameId)}/events`, input));
  }

  dohvatiSazetakUtakmice(gameId: number): Promise<OdgovorSazetkaUtakmice> {
    return this.#posaljiZahtjev(
      this.#http.get<OdgovorSazetkaUtakmice>(`${PREDMETAK_API}/games/${String(gameId)}/box-score`)
    );
  }

  dohvatiPokazateljeIgraca(gameId: number, playerId: number): Promise<OdgovorPokazateljaIgraca> {
    return this.#posaljiZahtjev(
      this.#http.get<OdgovorPokazateljaIgraca>(
        `${PREDMETAK_API}/games/${String(gameId)}/players/${String(playerId)}/stats`
      )
    );
  }

  dohvatiPokazateljeTima(gameId: number, teamId: number): Promise<OdgovorPokazateljaTima> {
    return this.#posaljiZahtjev(
      this.#http.get<OdgovorPokazateljaTima>(
        `${PREDMETAK_API}/games/${String(gameId)}/teams/${String(teamId)}/stats`
      )
    );
  }

  async #posaljiZahtjev<TRezultat>(response: Observable<TRezultat>): Promise<TRezultat> {
    try {
      return await firstValueFrom(response);
    } catch (error) {

      throw new Error(dohvatiPorukuPogreske(error), { cause: error });
    }
  }
}
