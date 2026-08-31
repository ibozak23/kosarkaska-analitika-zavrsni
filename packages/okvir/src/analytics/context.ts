import type { Game } from "../domain/game.js";
import type { Player } from "../domain/player.js";
import type { Team } from "../domain/team.js";

// Box score, TS%, plus-minus, PER.
export interface PlayerContext {
  readonly game: Game;
  readonly player: Player;
}

//Tempo, ofenzivni i defenzivni pokazatelj.
export interface TeamContext {
  readonly game: Game;
  readonly team: Team;
}
