import type Database from "better-sqlite3";
import type { GameEvent } from "@ibozak23/kosarkaska-analitika";

import { pretvoriRedakUDogadjaj, pretvoriDogadjajURedakZaUpis } from "./preslikivac-dogadjaja.js";
import type { DogadjajZaUpis, RedakDogadjaja, RedakDogadjajaZaUpis } from "./preslikivac-dogadjaja.js";

export class RepozitorijDogadjaja {
  readonly #naredbaUpisa: Database.Statement<RedakDogadjajaZaUpis>;
  readonly #naredbaUpisaVise: (ulazi: readonly DogadjajZaUpis[]) => GameEvent[];
  readonly #naredbaDohvataZaUtakmicu: Database.Statement<{ gameId: number }, RedakDogadjaja>;
  readonly #naredbaBrojanjaZaIgraca: Database.Statement<{ playerId: number }, { broj: number }>;

  constructor(baza: Database.Database) {
    this.#naredbaUpisa = baza.prepare<RedakDogadjajaZaUpis>(
      `INSERT INTO game_event (game_id, player_id, team_id, event_type, quarter, minute, second,
                               shot_points, shot_made, substitution_direction)
       VALUES (@game_id, @player_id, @team_id, @event_type, @quarter, @minute, @second,
               @shot_points, @shot_made, @substitution_direction)`
    );

    this.#naredbaUpisaVise = baza.transaction((ulazi: readonly DogadjajZaUpis[]): GameEvent[] =>
      ulazi.map((ulaz) => this.spremi(ulaz))
    );

    this.#naredbaDohvataZaUtakmicu = baza.prepare<{ gameId: number }, RedakDogadjaja>(
      `SELECT * FROM game_event WHERE game_id = @gameId
        ORDER BY quarter ASC, minute * 60 + second DESC, id ASC`
    );

    this.#naredbaBrojanjaZaIgraca = baza.prepare<{ playerId: number }, { broj: number }>(
      "SELECT COUNT(*) AS broj FROM game_event WHERE player_id = @playerId"
    );
  }

  spremi(ulaz: DogadjajZaUpis): GameEvent {
    const redak = pretvoriDogadjajURedakZaUpis(ulaz);
    const ishod = this.#naredbaUpisa.run(redak);

    return pretvoriRedakUDogadjaj({ id: Number(ishod.lastInsertRowid), ...redak });
  }

  spremiVise(ulazi: readonly DogadjajZaUpis[]): GameEvent[] {
    return this.#naredbaUpisaVise(ulazi);
  }

  dohvatiZaUtakmicu(gameId: number): GameEvent[] {
    return this.#naredbaDohvataZaUtakmicu.all({ gameId }).map(pretvoriRedakUDogadjaj);
  }

  izbrojiZaIgraca(playerId: number): number {
    return this.#naredbaBrojanjaZaIgraca.get({ playerId })?.broj ?? 0;
  }
}
