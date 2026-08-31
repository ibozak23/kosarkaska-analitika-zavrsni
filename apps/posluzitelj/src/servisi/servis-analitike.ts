import { DefensiveRatingCalculator, OffensiveRatingCalculator, PERCalculator, PaceCalculator, PlayerBoxScoreCalculator, PlusMinusCalculator, StatisticsEngine, TrueShootingCalculator } from "@ibozak23/kosarkaska-analitika";
import type {Game, GameEvent, LeagueConstants, Player, PlayerStats, Team, TeamStats } from "@ibozak23/kosarkaska-analitika";

import { PogreskaNepostojecegZapisa } from "../pogreske/pogreske.js";
import type { RepozitorijDogadjaja } from "../repozitoriji/repozitorij-dogadjaja.js";
import type { RepozitorijUtakmica } from "../repozitoriji/repozitorij-utakmica.js";
import type { RepozitorijIgraca } from "../repozitoriji/repozitorij-igraca.js";
import type { RepozitorijTimova } from "../repozitoriji/repozitorij-timova.js";

export interface RedakIgracaUZapisniku {
  readonly player: Player;
  readonly stats: PlayerStats;
}

export interface SazetakTima {
  readonly team: Team;
  readonly stats: TeamStats;
  readonly players: readonly RedakIgracaUZapisniku[];
}

export interface SazetakUtakmice {
  readonly game: Game;
  readonly home: SazetakTima;
  readonly away: SazetakTima;
}

export class ServisAnalitike {
  readonly #utakmice: RepozitorijUtakmica;
  readonly #timovi: RepozitorijTimova;
  readonly #igraci: RepozitorijIgraca;
  readonly #dogadjaji: RepozitorijDogadjaja;
  readonly #motor: StatisticsEngine;

  constructor(
    utakmice: RepozitorijUtakmica,
    timovi: RepozitorijTimova,
    igraci: RepozitorijIgraca,
    dogadjaji: RepozitorijDogadjaja,
    ligaskeKonstante: LeagueConstants
  ) {
    this.#utakmice = utakmice;
    this.#timovi = timovi;
    this.#igraci = igraci;
    this.#dogadjaji = dogadjaji;

    this.#motor = new StatisticsEngine();
    this.#motor.registerPlayerCalculator(new PlayerBoxScoreCalculator());
    this.#motor.registerPlayerCalculator(new TrueShootingCalculator());
    this.#motor.registerPlayerCalculator(new PlusMinusCalculator());
    this.#motor.registerPlayerCalculator(new PERCalculator(ligaskeKonstante));
    this.#motor.registerTeamCalculator(new PaceCalculator());
    this.#motor.registerTeamCalculator(new OffensiveRatingCalculator());
    this.#motor.registerTeamCalculator(new DefensiveRatingCalculator());
  }

  izracunajPokazateljeIgraca(gameId: number, playerId: number): PlayerStats {
    const utakmica = this.#dohvatiObaveznuUtakmicu(gameId);
    const igrac = this.#dohvatiObaveznogIgraca(playerId);

    return this.#motor.calculatePlayerStats({ game: utakmica, player: igrac }, this.#dogadjaji.dohvatiZaUtakmicu(gameId));
  }

  izracunajPokazateljeTima(gameId: number, teamId: number): TeamStats {
    const utakmica = this.#dohvatiObaveznuUtakmicu(gameId);
    const tim = this.#dohvatiObavezniTim(teamId);

    return this.#motor.calculateTeamStats({ game: utakmica, team: tim }, this.#dogadjaji.dohvatiZaUtakmicu(gameId));
  }

  izracunajSazetakUtakmice(gameId: number): SazetakUtakmice {
    const utakmica = this.#dohvatiObaveznuUtakmicu(gameId);
    const dogadjaji = this.#dogadjaji.dohvatiZaUtakmicu(gameId);

    return {
      game: utakmica,
      home: this.#izracunajSazetakZaTim(utakmica, utakmica.homeTeamId, dogadjaji),
      away: this.#izracunajSazetakZaTim(utakmica, utakmica.awayTeamId, dogadjaji)
    };
  }

  #izracunajSazetakZaTim(utakmica: Game, teamId: number, dogadjaji: readonly GameEvent[]): SazetakTima {
    const tim = this.#dohvatiObavezniTim(teamId);
    const igraci = this.#igraci.dohvatiZaTim(teamId).map((igrac) => ({
      player: igrac,
      stats: this.#motor.calculatePlayerStats({ game: utakmica, player: igrac }, dogadjaji)
    }));

    return {
      team: tim,
      stats: this.#motor.calculateTeamStats({ game: utakmica, team: tim }, dogadjaji),
      players: igraci
    };
  }

  #dohvatiObaveznuUtakmicu(gameId: number): Game {
    const utakmica = this.#utakmice.dohvatiPoOznaci(gameId);

    if (utakmica === null) {
      throw new PogreskaNepostojecegZapisa(`Utakmica ${gameId} ne postoji.`);
    }

    return utakmica;
  }

  #dohvatiObavezniTim(teamId: number): Team {
    const tim = this.#timovi.dohvatiPoOznaci(teamId);

    if (tim === null) {
      throw new PogreskaNepostojecegZapisa(`Tim ${teamId} ne postoji.`);
    }

    return tim;
  }

  #dohvatiObaveznogIgraca(playerId: number): Player {
    const igrac = this.#igraci.dohvatiPoOznaci(playerId);

    if (igrac === null) {
      throw new PogreskaNepostojecegZapisa(`Igrač ${playerId} ne postoji.`);
    }

    return igrac;
  }
}
