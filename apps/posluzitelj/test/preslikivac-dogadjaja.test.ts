import { describe, expect, it } from "vitest";
import { EventType, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";

import { pretvoriRedakUDogadjaj, pretvoriDogadjajURedak, pretvoriDogadjajURedakZaUpis } from "../src/repozitoriji/preslikivac-dogadjaja.js";
import type { RedakDogadjaja } from "../src/repozitoriji/preslikivac-dogadjaja.js";

const OSNOVA = {
  game_id: 1,
  player_id: 7,
  team_id: 1,
  quarter: 2,
  minute: 5,
  second: 50,
  shot_points: null,
  shot_made: null,
  substitution_direction: null
};

const SUT: RedakDogadjaja = { id: 1, ...OSNOVA, event_type: "SHOT", shot_points: 3, shot_made: 1 };
const ASISTENCIJA: RedakDogadjaja = { id: 2, ...OSNOVA, event_type: "ASSIST" };
const IZMJENA: RedakDogadjaja = {
  id: 9,
  ...OSNOVA,
  event_type: "SUBSTITUTION",
  substitution_direction: "IN"
};

const ZAPISI: readonly RedakDogadjaja[] = [
  SUT,
  ASISTENCIJA,
  { id: 3, ...OSNOVA, event_type: "REBOUND_OFF" },
  { id: 4, ...OSNOVA, event_type: "REBOUND_DEF" },
  { id: 5, ...OSNOVA, event_type: "FOUL" },
  { id: 6, ...OSNOVA, event_type: "TURNOVER" },
  { id: 7, ...OSNOVA, event_type: "BLOCK" },
  { id: 8, ...OSNOVA, event_type: "STEAL" },
  IZMJENA
];

describe("kružno preslikavanje svih devet tipova događaja", () => {
  for (const zapis of ZAPISI) {
    it(`zapis vrste ${zapis.event_type} preslikan u objekt i natrag ostaje istovjetan`, () => {
      expect(pretvoriDogadjajURedak(pretvoriRedakUDogadjaj(zapis))).toEqual(zapis);
    });
  }

  it("promašen šut zadržava ishod pri oba preslikavanja", () => {
    const promasaj: RedakDogadjaja = { ...SUT, shot_points: 2, shot_made: 0 };

    expect(pretvoriDogadjajURedak(pretvoriRedakUDogadjaj(promasaj))).toEqual(promasaj);
  });
});

describe("preslikavanje zapisa u tip iz hijerarhije", () => {
  it("šut dobiva polja koja ostali događaji nemaju", () => {
    const dogadjaj = pretvoriRedakUDogadjaj(SUT);

    if (dogadjaj.type !== EventType.SHOT) {
      throw new Error("preslikivač nije vratio šut");
    }

    expect(dogadjaj.points).toBe(3);
    expect(dogadjaj.made).toBe(true);
    expect("points" in pretvoriRedakUDogadjaj(ASISTENCIJA)).toBe(false);
  });

  it("izmjena dobiva smjer", () => {
    const dogadjaj = pretvoriRedakUDogadjaj(IZMJENA);

    if (dogadjaj.type !== EventType.SUBSTITUTION) {
      throw new Error("preslikivač nije vratio izmjenu");
    }

    expect(dogadjaj.direction).toBe(SubstitutionDirection.IN);
  });

  it("zajednička polja prelaze iz stupaca u imena okvira", () => {
    const dogadjaj = pretvoriRedakUDogadjaj(ASISTENCIJA);

    expect(dogadjaj.id).toBe(2);
    expect(dogadjaj.gameId).toBe(1);
    expect(dogadjaj.playerId).toBe(7);
    expect(dogadjaj.teamId).toBe(1);
    expect(dogadjaj.quarter).toBe(2);
    expect(dogadjaj.minute).toBe(5);
    expect(dogadjaj.second).toBe(50);
  });
});

describe("preslikavanje objekta u zapis", () => {
  it("događaj bez dodatnih podataka ostavlja tri stupca prazna", () => {
    const zapis = pretvoriDogadjajURedakZaUpis(pretvoriRedakUDogadjaj(ASISTENCIJA));

    expect(zapis.shot_points).toBeNull();
    expect(zapis.shot_made).toBeNull();
    expect(zapis.substitution_direction).toBeNull();
  });
});
