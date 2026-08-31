export const SQL_SHEME = `
CREATE TABLE IF NOT EXISTS team (
  id     INTEGER PRIMARY KEY,
  name   TEXT NOT NULL,
  city   TEXT,
  league TEXT,
  season TEXT
);

CREATE TABLE IF NOT EXISTS player (
  id            INTEGER PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  position      TEXT NOT NULL CHECK (position IN ('PG', 'SG', 'SF', 'PF', 'C')),
  height_cm     INTEGER,
  jersey_number INTEGER,
  team_id       INTEGER NOT NULL REFERENCES team (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS game (
  id           INTEGER PRIMARY KEY,
  played_at    TEXT NOT NULL,
  home_team_id INTEGER NOT NULL REFERENCES team (id) ON DELETE RESTRICT,
  away_team_id INTEGER NOT NULL REFERENCES team (id) ON DELETE RESTRICT,
  status       TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'FINISHED'))
);

CREATE TABLE IF NOT EXISTS game_event (
  id                     INTEGER PRIMARY KEY,
  game_id                INTEGER NOT NULL REFERENCES game (id) ON DELETE CASCADE,
  player_id              INTEGER NOT NULL REFERENCES player (id) ON DELETE RESTRICT,
  team_id                INTEGER NOT NULL REFERENCES team (id) ON DELETE RESTRICT,
  event_type             TEXT NOT NULL CHECK (event_type IN (
                           'SHOT', 'ASSIST', 'REBOUND_OFF', 'REBOUND_DEF', 'FOUL',
                           'TURNOVER', 'BLOCK', 'STEAL', 'SUBSTITUTION')),
  quarter                INTEGER NOT NULL,
  minute                 INTEGER NOT NULL,
  second                 INTEGER NOT NULL,
  shot_points            INTEGER CHECK (shot_points IN (1, 2, 3)),
  shot_made              INTEGER CHECK (shot_made IN (0, 1)),
  substitution_direction TEXT CHECK (substitution_direction IN ('IN', 'OUT')),

  CHECK (
    quarter >= 1 AND minute >= 0 AND second BETWEEN 0 AND 59
    AND minute * 60 + second <= CASE WHEN quarter <= 4 THEN 600 ELSE 300 END
  ),

  CHECK (
       (event_type = 'SHOT'
        AND shot_points IS NOT NULL AND shot_made IS NOT NULL
        AND substitution_direction IS NULL)
    OR (event_type = 'SUBSTITUTION'
        AND substitution_direction IS NOT NULL
        AND shot_points IS NULL AND shot_made IS NULL)
    OR (event_type NOT IN ('SHOT', 'SUBSTITUTION')
        AND shot_points IS NULL AND shot_made IS NULL
        AND substitution_direction IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS game_event_game_player ON game_event (game_id, player_id);
CREATE INDEX IF NOT EXISTS game_event_player ON game_event (player_id);
CREATE INDEX IF NOT EXISTS player_team ON player (team_id);
`;
