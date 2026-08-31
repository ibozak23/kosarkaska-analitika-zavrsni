import type Database from "better-sqlite3";
import type { Player, Position } from "@ibozak23/kosarkaska-analitika";

export type IgracZaUpis = Omit<Player, "id">;

interface RedakIgraca {
  readonly id: number;
  readonly first_name: string;
  readonly last_name: string;
  readonly position: string;
  readonly height_cm: number | null;
  readonly jersey_number: number | null;
  readonly team_id: number;
}

// snake_case u camelCase.
function pretvoriRedakUIgraca(redak: RedakIgraca): Player {
  return {
    id: redak.id,
    firstName: redak.first_name,
    lastName: redak.last_name,
    position: redak.position as Position,
    heightCm: redak.height_cm,
    jerseyNumber: redak.jersey_number,
    teamId: redak.team_id
  };
}

export class RepozitorijIgraca {
  readonly #naredbaUpisa: Database.Statement<IgracZaUpis>;
  readonly #naredbaIzmjene: Database.Statement<Player>;
  readonly #naredbaBrisanja: Database.Statement<{ id: number }>;
  readonly #naredbaDohvataSvih: Database.Statement<[], RedakIgraca>;
  readonly #naredbaDohvataPoOznaci: Database.Statement<{ id: number }, RedakIgraca>;
  readonly #naredbaDohvataZaTim: Database.Statement<{ teamId: number }, RedakIgraca>;

  constructor(baza: Database.Database) {
    this.#naredbaUpisa = baza.prepare<IgracZaUpis>(
      `INSERT INTO player (first_name, last_name, position, height_cm, jersey_number, team_id)
       VALUES (@firstName, @lastName, @position, @heightCm, @jerseyNumber, @teamId)`
    );
    this.#naredbaIzmjene = baza.prepare<Player>(
      `UPDATE player
          SET first_name = @firstName, last_name = @lastName, position = @position,
              height_cm = @heightCm, jersey_number = @jerseyNumber, team_id = @teamId
        WHERE id = @id`
    );
    this.#naredbaBrisanja = baza.prepare<{ id: number }>("DELETE FROM player WHERE id = @id");
    this.#naredbaDohvataSvih = baza.prepare<[], RedakIgraca>(
      "SELECT * FROM player ORDER BY last_name, first_name"
    );
    this.#naredbaDohvataPoOznaci = baza.prepare<{ id: number }, RedakIgraca>(
      "SELECT * FROM player WHERE id = @id"
    );
    this.#naredbaDohvataZaTim = baza.prepare<{ teamId: number }, RedakIgraca>(
      "SELECT * FROM player WHERE team_id = @teamId ORDER BY jersey_number"
    );
  }

  spremi(ulaz: IgracZaUpis): Player {
    const ishod = this.#naredbaUpisa.run(ulaz);
    return { id: Number(ishod.lastInsertRowid), ...ulaz };
  }

  dohvatiSve(): Player[] {
    return this.#naredbaDohvataSvih.all().map(pretvoriRedakUIgraca);
  }

  dohvatiPoOznaci(id: number): Player | null {
    const redak = this.#naredbaDohvataPoOznaci.get({ id });
    return redak === undefined ? null : pretvoriRedakUIgraca(redak);
  }

  dohvatiZaTim(teamId: number): Player[] {
    return this.#naredbaDohvataZaTim.all({ teamId }).map(pretvoriRedakUIgraca);
  }

  izmijeni(id: number, ulaz: IgracZaUpis): Player {
    const igrac: Player = { id, ...ulaz };

    this.#naredbaIzmjene.run(igrac);

    return igrac;
  }

  obrisi(id: number): void {
    this.#naredbaBrisanja.run({ id });
  }
}
