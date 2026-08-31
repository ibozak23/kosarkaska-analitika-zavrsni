import { GameStatus } from "@ibozak23/kosarkaska-analitika";
import type Database from "better-sqlite3";
import type { Game } from "@ibozak23/kosarkaska-analitika";

export type UtakmicaZaUpis = Omit<Game, "id">;

interface RedakUtakmice {
  readonly id: number;
  readonly played_at: string;
  readonly home_team_id: number;
  readonly away_team_id: number;
  readonly status: string;
}

interface ParametriUtakmice {
  readonly playedAt: string;
  readonly homeTeamId: number;
  readonly awayTeamId: number;
  readonly status: GameStatus;
}

function pretvoriRedakUUtakmicu(redak: RedakUtakmice): Game {
  return {
    id: redak.id,
    playedAt: new Date(redak.played_at),
    homeTeamId: redak.home_team_id,
    awayTeamId: redak.away_team_id,
    status: redak.status as GameStatus
  };
}

export class RepozitorijUtakmica {
  readonly #naredbaUpisa: Database.Statement<ParametriUtakmice>;
  readonly #naredbaZavrsetka: Database.Statement<{ id: number }>;
  readonly #naredbaDohvataSvih: Database.Statement<[], RedakUtakmice>;
  readonly #naredbaDohvataPoOznaci: Database.Statement<{ id: number }, RedakUtakmice>;

  constructor(baza: Database.Database) {
    this.#naredbaUpisa = baza.prepare<ParametriUtakmice>(
      `INSERT INTO game (played_at, home_team_id, away_team_id, status)
       VALUES (@playedAt, @homeTeamId, @awayTeamId, @status)`
    );
    this.#naredbaZavrsetka = baza.prepare<{ id: number }>(
      `UPDATE game SET status = '${GameStatus.FINISHED}' WHERE id = @id`
    );
    this.#naredbaDohvataSvih = baza.prepare<[], RedakUtakmice>("SELECT * FROM game ORDER BY played_at DESC");
    this.#naredbaDohvataPoOznaci = baza.prepare<{ id: number }, RedakUtakmice>("SELECT * FROM game WHERE id = @id");
  }

  spremi(ulaz: UtakmicaZaUpis): Game {
    const ishod = this.#naredbaUpisa.run({
      playedAt: ulaz.playedAt.toISOString(),
      homeTeamId: ulaz.homeTeamId,
      awayTeamId: ulaz.awayTeamId,
      status: ulaz.status
    });

    return { id: Number(ishod.lastInsertRowid), ...ulaz };
  }

  dohvatiSve(): Game[] {
    return this.#naredbaDohvataSvih.all().map(pretvoriRedakUUtakmicu);
  }

  dohvatiPoOznaci(id: number): Game | null {
    const redak = this.#naredbaDohvataPoOznaci.get({ id });
    return redak === undefined ? null : pretvoriRedakUUtakmicu(redak);
  }

  izmijeniUZavrsenu(id: number): void {
    this.#naredbaZavrsetka.run({ id });
  }
}
