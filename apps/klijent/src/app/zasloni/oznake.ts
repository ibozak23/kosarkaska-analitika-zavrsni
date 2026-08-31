
import { EventType, GameStatus, Position, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";
import type { GameEvent } from "@ibozak23/kosarkaska-analitika";

export interface Izbor<TVrijednost> {
  readonly vrijednost: TVrijednost;
  readonly oznaka: string;
}

export const POZICIJE: readonly Izbor<Position>[] = [
  { vrijednost: Position.PG, oznaka: "PG — organizator igre" },
  { vrijednost: Position.SG, oznaka: "SG — bek šuter" },
  { vrijednost: Position.SF, oznaka: "SF — niska krila" },
  { vrijednost: Position.PF, oznaka: "PF — krilni centar" },
  { vrijednost: Position.C, oznaka: "C — centar" }
];

export const VRSTE_DOGADJAJA: readonly Izbor<EventType>[] = [
  { vrijednost: EventType.SHOT, oznaka: "Šut" },
  { vrijednost: EventType.ASSIST, oznaka: "Asistencija" },
  { vrijednost: EventType.REBOUND_OFF, oznaka: "Ofenzivni skok" },
  { vrijednost: EventType.REBOUND_DEF, oznaka: "Defenzivni skok" },
  { vrijednost: EventType.FOUL, oznaka: "Faul" },
  { vrijednost: EventType.TURNOVER, oznaka: "Izgubljena lopta" },
  { vrijednost: EventType.BLOCK, oznaka: "Blok" },
  { vrijednost: EventType.STEAL, oznaka: "Ukradena lopta" },
  { vrijednost: EventType.SUBSTITUTION, oznaka: "Izmjena" }
];

export const SMJEROVI_IZMJENE: readonly Izbor<SubstitutionDirection>[] = [
  { vrijednost: SubstitutionDirection.IN, oznaka: "Ulazak" },
  { vrijednost: SubstitutionDirection.OUT, oznaka: "Izlazak" }
];

export const BODOVI_SUTA: readonly Izbor<1 | 2 | 3>[] = [
  { vrijednost: 1, oznaka: "Slobodno bacanje" },
  { vrijednost: 2, oznaka: "Šut za 2" },
  { vrijednost: 3, oznaka: "Šut za 3" }
];

export function oznakaStanja(stanje: GameStatus): string {
  switch (stanje) {
    case GameStatus.SCHEDULED:
      return "Zakazana";
    case GameStatus.IN_PROGRESS:
      return "U tijeku";
    case GameStatus.FINISHED:
      return "Završena";
  }
}

export function opisDogadjaja(dogadjaj: GameEvent): string {
  switch (dogadjaj.type) {
    case EventType.SHOT:
      return `${dogadjaj.points === 1 ? "Slobodno bacanje" : `Šut za ${String(dogadjaj.points)}`} — ${dogadjaj.made ? "pogođen" : "promašen"}`;
    case EventType.SUBSTITUTION:
      return dogadjaj.direction === SubstitutionDirection.IN ? "Izmjena — ulazak" : "Izmjena — izlazak";
    case EventType.ASSIST:
      return "Asistencija";
    case EventType.REBOUND_OFF:
      return "Ofenzivni skok";
    case EventType.REBOUND_DEF:
      return "Defenzivni skok";
    case EventType.FOUL:
      return "Faul";
    case EventType.TURNOVER:
      return "Izgubljena lopta";
    case EventType.BLOCK:
      return "Blok";
    case EventType.STEAL:
      return "Ukradena lopta";
  }
}
