
import type { Game, GameEvent, Player, PlayerStats, Position, Team, TeamStats } from "@ibozak23/kosarkaska-analitika";

export interface OdgovorUtakmice extends Omit<Game, "playedAt"> {
  readonly playedAt: string;
}

export interface OdgovorPokazateljaIgraca extends Omit<PlayerStats, "custom"> {
  readonly custom: Record<string, unknown>;
}

export interface OdgovorPokazateljaTima extends Omit<TeamStats, "custom"> {
  readonly custom: Record<string, unknown>;
}

export interface OdgovorRetkaIgraca {
  readonly player: Player;
  readonly stats: OdgovorPokazateljaIgraca;
}

export interface OdgovorSazetkaTima {
  readonly team: Team;
  readonly stats: OdgovorPokazateljaTima;
  readonly players: readonly OdgovorRetkaIgraca[];
}

export interface OdgovorSazetkaUtakmice {
  readonly game: OdgovorUtakmice;
  readonly home: OdgovorSazetkaTima;
  readonly away: OdgovorSazetkaTima;
}

export interface ZahtjevZaTim {
  readonly name: string;
  readonly city: string | null;
  readonly league: string | null;
  readonly season: string | null;
}

export interface ZahtjevZaIgraca {
  readonly firstName: string;
  readonly lastName: string;
  readonly position: Position;
  readonly heightCm: number | null;
  readonly jerseyNumber: number | null;
  readonly teamId: number;
}

export interface ZahtjevZaPrijavuUtakmice {
  readonly playedAt: string;
  readonly homeTeamId: number;
  readonly awayTeamId: number;
  readonly homeStarters: readonly number[];
  readonly awayStarters: readonly number[];
}

type BezOznaka<TDogadjaj> = TDogadjaj extends GameEvent ? Omit<TDogadjaj, "id" | "gameId"> : never;

export type ZahtjevZaDogadjaj = BezOznaka<GameEvent>;
