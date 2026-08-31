import { EventType } from "@ibozak23/kosarkaska-analitika";
import type { GameEvent, GameEventBase, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";

export interface RedakDogadjaja {
  readonly id: number;
  readonly game_id: number;
  readonly player_id: number;
  readonly team_id: number;
  readonly event_type: string;
  readonly quarter: number;
  readonly minute: number;
  readonly second: number;
  readonly shot_points: number | null;
  readonly shot_made: number | null;
  readonly substitution_direction: string | null;
}

export type RedakDogadjajaZaUpis = Omit<RedakDogadjaja, "id">;

type BezOznake<TEvent> = TEvent extends GameEvent ? Omit<TEvent, "id"> : never;

export type DogadjajZaUpis = BezOznake<GameEvent>;

// Redak baze -> događaj
export function pretvoriRedakUDogadjaj(redak: RedakDogadjaja): GameEvent {
  const base: GameEventBase = {
    id: redak.id,
    gameId: redak.game_id,
    playerId: redak.player_id,
    teamId: redak.team_id,
    quarter: redak.quarter,
    minute: redak.minute,
    second: redak.second
  };

  switch (redak.event_type as EventType) {
    case EventType.SHOT:
      return {
        ...base,
        type: EventType.SHOT,
        points: redak.shot_points as 1 | 2 | 3,
        made: redak.shot_made === 1
      };
    case EventType.SUBSTITUTION:
      return {
        ...base,
        type: EventType.SUBSTITUTION,
        direction: redak.substitution_direction as SubstitutionDirection
      };
    case EventType.ASSIST:
      return { ...base, type: EventType.ASSIST };
    case EventType.REBOUND_OFF:
      return { ...base, type: EventType.REBOUND_OFF };
    case EventType.REBOUND_DEF:
      return { ...base, type: EventType.REBOUND_DEF };
    case EventType.FOUL:
      return { ...base, type: EventType.FOUL };
    case EventType.TURNOVER:
      return { ...base, type: EventType.TURNOVER };
    case EventType.BLOCK:
      return { ...base, type: EventType.BLOCK };
    case EventType.STEAL:
      return { ...base, type: EventType.STEAL };
  }
}

// Događaj -> redak 
export function pretvoriDogadjajURedakZaUpis(event: DogadjajZaUpis): RedakDogadjajaZaUpis {
  const base = {
    game_id: event.gameId,
    player_id: event.playerId,
    team_id: event.teamId,
    event_type: event.type,
    quarter: event.quarter,
    minute: event.minute,
    second: event.second
  };

  switch (event.type) {
    case EventType.SHOT:
      return {
        ...base,
        shot_points: event.points,
        shot_made: event.made ? 1 : 0,
        substitution_direction: null
      };
    case EventType.SUBSTITUTION:
      return {
        ...base,
        shot_points: null,
        shot_made: null,
        substitution_direction: event.direction
      };
    default:
      return { ...base, shot_points: null, shot_made: null, substitution_direction: null };
  }
}

// Isto to ali za događaj koji već ima id
export function pretvoriDogadjajURedak(event: GameEvent): RedakDogadjaja {
  return { id: event.id, ...pretvoriDogadjajURedakZaUpis(event) };
}
