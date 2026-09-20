import type { EventType, Position, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";

export const STRANE_UTAKMICE = ["DOMACI", "GOSTI"] as const;

export type StranaUtakmice = (typeof STRANE_UTAKMICE)[number];

export interface PogreskaUvoza {
  readonly redak: number;
  readonly poruka: string;
}

export interface UvezeniTim {
  readonly redak: number;
  readonly strana: StranaUtakmice;
  readonly naziv: string;
  readonly grad: string | null;
  readonly liga: string | null;
  readonly sezona: string | null;
}

export interface UvezeniIgrac {
  readonly redak: number;
  readonly strana: StranaUtakmice;
  readonly dres: number;
  readonly ime: string;
  readonly prezime: string;
  readonly pozicija: Position;
  readonly visina: number | null;
}

export interface UvezenaPetorka {
  readonly redak: number;
  readonly strana: StranaUtakmice;
  readonly dresovi: readonly number[];
}

export interface UvezeniDogadjajOsnova {
  readonly redak: number;
  readonly strana: StranaUtakmice;
  readonly dres: number;
  readonly cetvrtina: number;
  readonly minuta: number;
  readonly sekunda: number;
}

export type UvezeniDogadjaj =
  | (UvezeniDogadjajOsnova & { readonly tip: EventType.SHOT; readonly poeni: 1 | 2 | 3; readonly pogodak: boolean })
  | (UvezeniDogadjajOsnova & { readonly tip: EventType.SUBSTITUTION; readonly smjer: SubstitutionDirection })
  | (UvezeniDogadjajOsnova & { readonly tip: Exclude<EventType, EventType.SHOT | EventType.SUBSTITUTION> });

export interface UvezenaUtakmica {
  readonly odigranoU: string | null;
  readonly timovi: readonly UvezeniTim[];
  readonly igraci: readonly UvezeniIgrac[];
  readonly petorke: readonly UvezenaPetorka[];
  readonly dogadjaji: readonly UvezeniDogadjaj[];
}

export interface IshodCitanja {
  readonly utakmica: UvezenaUtakmica;
  readonly pogreske: readonly PogreskaUvoza[];
}
