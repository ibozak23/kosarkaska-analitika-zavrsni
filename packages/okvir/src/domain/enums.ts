export enum Position {
  PG = "PG",
  SG = "SG",
  SF = "SF",
  PF = "PF",
  C = "C"
}

export enum GameStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED"
}

export enum EventType {
  SHOT = "SHOT",
  ASSIST = "ASSIST",
  REBOUND_OFF = "REBOUND_OFF",
  REBOUND_DEF = "REBOUND_DEF",
  FOUL = "FOUL",
  TURNOVER = "TURNOVER",
  BLOCK = "BLOCK",
  STEAL = "STEAL",
  SUBSTITUTION = "SUBSTITUTION"
}

export enum SubstitutionDirection {
  IN = "IN",
  OUT = "OUT"
}
