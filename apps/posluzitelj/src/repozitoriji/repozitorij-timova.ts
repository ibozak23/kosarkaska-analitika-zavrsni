import type Database from "better-sqlite3";
import type { Team } from "@ibozak23/kosarkaska-analitika";

export type TimZaUpis = Omit<Team, "id">;

export class RepozitorijTimova {
  readonly #naredbaUpisa: Database.Statement<TimZaUpis>;
  readonly #naredbaIzmjene: Database.Statement<Team>;
  readonly #naredbaBrisanja: Database.Statement<{ id: number }>;
  readonly #naredbaDohvataSvih: Database.Statement<[], Team>;
  readonly #naredbaDohvataPoOznaci: Database.Statement<{ id: number }, Team>;

  constructor(baza: Database.Database) {
    this.#naredbaUpisa = baza.prepare<TimZaUpis>(
      "INSERT INTO team (name, city, league, season) VALUES (@name, @city, @league, @season)"
    );
    this.#naredbaIzmjene = baza.prepare<Team>(
      "UPDATE team SET name = @name, city = @city, league = @league, season = @season WHERE id = @id"
    );
    this.#naredbaBrisanja = baza.prepare<{ id: number }>("DELETE FROM team WHERE id = @id");
    this.#naredbaDohvataSvih = baza.prepare<[], Team>("SELECT * FROM team ORDER BY name");
    this.#naredbaDohvataPoOznaci = baza.prepare<{ id: number }, Team>("SELECT * FROM team WHERE id = @id");
  }

  spremi(ulaz: TimZaUpis): Team {
    const ishod = this.#naredbaUpisa.run(ulaz);
    return { id: Number(ishod.lastInsertRowid), ...ulaz };
  }

  dohvatiSve(): Team[] {
    return this.#naredbaDohvataSvih.all();
  }

  dohvatiPoOznaci(id: number): Team | null {
    return this.#naredbaDohvataPoOznaci.get({ id }) ?? null;
  }

  izmijeni(id: number, ulaz: TimZaUpis): Team {
    const tim: Team = { id, ...ulaz };

    this.#naredbaIzmjene.run(tim);

    return tim;
  }

  obrisi(id: number): void {
    this.#naredbaBrisanja.run({ id });
  }
}
