import { EventType } from "@ibozak23/kosarkaska-analitika";

import type { Servisi } from "../src/sastavljanje-servisa.js";
import type { DogadjajZaUpis } from "../src/repozitoriji/preslikivac-dogadjaja.js";
import type { DemonstracijskiDogadjaj, Strana } from "./podaci-utakmice.js";
import { DRESOVI_GOSTUJUCE_PETORKE, IME_GOSTUJUCEG_TIMA, DOGADJAJI_UTAKMICE, VRIJEME_UTAKMICE, DRESOVI_DOMACE_PETORKE, IME_DOMACEG_TIMA } from "./podaci-utakmice.js";
import { LIGA } from "./podaci-lige.js";

export interface IshodPunjenja {
  readonly brojTimova: number;
  readonly brojIgraca: number;
  readonly brojUtakmica: number;
  readonly brojDogadjaja: number;
}

interface Sastav {
  readonly teamId: number;
  readonly oznakeIgraca: ReadonlyMap<number, number>;
}

function pretvoriUDogadjajZaUpis(
  gameId: number,
  teamId: number,
  playerId: number,
  demonstracijski: DemonstracijskiDogadjaj
): DogadjajZaUpis {
  const osnova = {
    gameId,
    playerId,
    teamId,
    quarter: demonstracijski.quarter,
    minute: demonstracijski.minute,
    second: demonstracijski.second
  };

  switch (demonstracijski.type) {
    case EventType.SHOT:
      return { ...osnova, type: EventType.SHOT, points: demonstracijski.points, made: demonstracijski.made };
    case EventType.SUBSTITUTION:
      return { ...osnova, type: EventType.SUBSTITUTION, direction: demonstracijski.direction };
    default:
      return { ...osnova, type: demonstracijski.type };
  }
}

export function spremiDemonstracijskePodatke(servisi: Servisi): IshodPunjenja {
  const sastavi = new Map<string, Sastav>();
  let brojIgraca = 0;

  for (const stavka of LIGA) {
    const tim = servisi.maticniPodaci.spremiTim(stavka.team);
    const oznakeIgraca = new Map<number, number>();

    for (const igrac of stavka.players) {
      const { id } = servisi.maticniPodaci.spremiIgraca({ ...igrac, teamId: tim.id });
      oznakeIgraca.set(igrac.jerseyNumber, id);
      brojIgraca += 1;
    }

    sastavi.set(stavka.team.name, { teamId: tim.id, oznakeIgraca });
  }

  const dohvatiObavezniSastav = (imeKluba: string): Sastav => {
    const sastav = sastavi.get(imeKluba);

    if (sastav === undefined) {
      throw new Error(`Demonstracijska utakmica traži klub ${imeKluba}, kojeg nema u ligi.`);
    }

    return sastav;
  };

  const domaci = dohvatiObavezniSastav(IME_DOMACEG_TIMA);
  const gosti = dohvatiObavezniSastav(IME_GOSTUJUCEG_TIMA);

  const dohvatiObaveznuOznakuIgraca = (strana: Strana, jerseyNumber: number): number => {
    const sastav = strana === "HOME" ? domaci : gosti;
    const playerId = sastav.oznakeIgraca.get(jerseyNumber);

    if (playerId === undefined) {
      throw new Error(`Demonstracijska utakmica traži dres ${jerseyNumber} u sastavu ${strana}.`);
    }

    return playerId;
  };

  const utakmica = servisi.utakmice.spremiPrijavuUtakmice({
    playedAt: VRIJEME_UTAKMICE,
    homeTeamId: domaci.teamId,
    awayTeamId: gosti.teamId,
    homeStarters: DRESOVI_DOMACE_PETORKE.map((dres) => dohvatiObaveznuOznakuIgraca("HOME", dres)),
    awayStarters: DRESOVI_GOSTUJUCE_PETORKE.map((dres) => dohvatiObaveznuOznakuIgraca("AWAY", dres))
  });

  for (const demonstracijski of DOGADJAJI_UTAKMICE) {
    const teamId = demonstracijski.strana === "HOME" ? domaci.teamId : gosti.teamId;
    servisi.utakmice.spremiDogadjaj(
      utakmica.id,
      pretvoriUDogadjajZaUpis(utakmica.id, teamId, dohvatiObaveznuOznakuIgraca(demonstracijski.strana, demonstracijski.jerseyNumber), demonstracijski)
    );
  }

  servisi.utakmice.izmijeniUtakmicuUZavrsenu(utakmica.id);

  return {
    brojTimova: LIGA.length,
    brojIgraca,
    brojUtakmica: 1,
    brojDogadjaja: servisi.utakmice.dohvatiDogadjaje(utakmica.id).length
  };
}
