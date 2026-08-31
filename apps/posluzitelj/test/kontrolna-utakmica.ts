import { EventType, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";

export const DOMACI_DRESOVI = [7, 8, 9, 10, 11];
export const GOSTUJUCI_DRESOVI = [21, 22, 23, 24, 25];

export interface KontrolniDogadjaj {
  readonly dres: number;
  readonly quarter: number;
  readonly minute: number;
  readonly second: number;
  readonly type: EventType;
  readonly points: 1 | 2 | 3 | null;
  readonly made: boolean | null;
  readonly direction: SubstitutionDirection | null;
}

function dogadjaj(
  dres: number,
  quarter: number,
  minute: number,
  second: number,
  type: EventType
): KontrolniDogadjaj {
  return { dres, quarter, minute, second, type, points: null, made: null, direction: null };
}

function sut(
  dres: number,
  quarter: number,
  minute: number,
  second: number,
  points: 1 | 2 | 3,
  made: boolean
): KontrolniDogadjaj {
  return { ...dogadjaj(dres, quarter, minute, second, EventType.SHOT), points, made };
}

function izmjena(
  dres: number,
  quarter: number,
  minute: number,
  second: number,
  direction: SubstitutionDirection
): KontrolniDogadjaj {
  return { ...dogadjaj(dres, quarter, minute, second, EventType.SUBSTITUTION), direction };
}

export const KONTROLNI_DOGADJAJI: readonly KontrolniDogadjaj[] = [
  dogadjaj(7, 1, 9, 20, EventType.REBOUND_DEF),
  sut(22, 1, 9, 0, 2, false),
  dogadjaj(23, 1, 8, 55, EventType.REBOUND_OFF),
  dogadjaj(7, 1, 8, 0, EventType.FOUL),
  sut(7, 1, 7, 46, 2, true),
  dogadjaj(24, 1, 7, 0, EventType.TURNOVER),
  dogadjaj(7, 1, 6, 40, EventType.TURNOVER),
  dogadjaj(22, 1, 6, 40, EventType.STEAL),
  sut(21, 1, 6, 20, 3, true),
  dogadjaj(7, 1, 5, 30, EventType.STEAL),
  izmjena(7, 1, 5, 0, SubstitutionDirection.OUT),
  dogadjaj(25, 1, 4, 30, EventType.FOUL),
  dogadjaj(10, 1, 4, 0, EventType.REBOUND_DEF),
  sut(23, 1, 3, 30, 3, false),
  dogadjaj(8, 1, 2, 40, EventType.ASSIST),
  sut(9, 1, 2, 40, 2, true),
  dogadjaj(22, 1, 0, 50, EventType.ASSIST),
  sut(21, 1, 0, 50, 2, true),

  izmjena(7, 2, 9, 0, SubstitutionDirection.IN),
  dogadjaj(7, 2, 8, 30, EventType.REBOUND_OFF),
  sut(24, 2, 8, 0, 2, false),
  dogadjaj(7, 2, 7, 30, EventType.REBOUND_DEF),
  dogadjaj(7, 2, 7, 0, EventType.ASSIST),
  sut(21, 2, 6, 30, 2, true),
  dogadjaj(9, 2, 5, 50, EventType.ASSIST),
  sut(7, 2, 5, 50, 3, true),
  dogadjaj(25, 2, 5, 0, EventType.TURNOVER),
  dogadjaj(9, 2, 5, 0, EventType.STEAL),
  dogadjaj(21, 2, 4, 56, EventType.FOUL),
  sut(7, 2, 4, 55, 1, true),
  sut(7, 2, 4, 50, 1, true),
  dogadjaj(7, 2, 4, 20, EventType.BLOCK),
  sut(7, 2, 4, 0, 2, false),
  dogadjaj(24, 2, 4, 0, EventType.BLOCK),
  dogadjaj(21, 2, 3, 55, EventType.REBOUND_DEF),
  sut(7, 2, 3, 30, 3, false),
  dogadjaj(22, 2, 3, 25, EventType.REBOUND_DEF),
  sut(7, 2, 3, 0, 2, false),
  dogadjaj(23, 2, 2, 55, EventType.REBOUND_DEF),
  dogadjaj(7, 2, 2, 40, EventType.FOUL),
  sut(7, 2, 2, 30, 1, false),
  dogadjaj(9, 2, 2, 28, EventType.REBOUND_OFF),
  sut(22, 2, 2, 25, 1, true),
  sut(22, 2, 2, 20, 1, false),
  dogadjaj(23, 2, 2, 18, EventType.REBOUND_OFF),
  dogadjaj(7, 2, 1, 20, EventType.TURNOVER),
  dogadjaj(23, 2, 1, 20, EventType.STEAL),
  dogadjaj(7, 2, 1, 15, EventType.ASSIST),
  sut(9, 2, 1, 15, 2, true),
  dogadjaj(8, 2, 0, 30, EventType.TURNOVER),

  sut(8, 3, 9, 0, 2, false),
  dogadjaj(24, 3, 8, 55, EventType.REBOUND_DEF),
  dogadjaj(23, 3, 8, 0, EventType.ASSIST),
  sut(21, 3, 8, 0, 2, true),
  sut(21, 3, 6, 0, 2, false),
  dogadjaj(7, 3, 5, 0, EventType.REBOUND_DEF),
  izmjena(7, 3, 4, 30, SubstitutionDirection.OUT),

  izmjena(7, 4, 9, 30, SubstitutionDirection.IN),
  sut(22, 4, 8, 0, 2, false),
  dogadjaj(10, 4, 6, 0, EventType.BLOCK),
  dogadjaj(21, 4, 5, 0, EventType.TURNOVER),
  dogadjaj(22, 4, 4, 0, EventType.FOUL),
  dogadjaj(11, 4, 3, 0, EventType.FOUL),
  sut(25, 4, 2, 0, 2, false),
  sut(7, 4, 1, 0, 2, true)
];
