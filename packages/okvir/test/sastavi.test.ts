import { describe, expect, it } from "vitest";

import { EventType, InvalidEventSequenceError, PlayerBoxScoreCalculator, StatisticsEngine, SubstitutionDirection } from "../src/index.js";
import type { GameEvent, Player, PlayerContext } from "../src/index.js";
import { domaciTim, gostujuciTim, igrac7, utakmica } from "./kontrolna-utakmica.js";


const kontekst: PlayerContext = { game: utakmica, player: igrac7 };
const kalkulator = new PlayerBoxScoreCalculator();

function izmjena(
  id: number,
  playerId: number,
  minute: number,
  direction: SubstitutionDirection,
  teamId = domaciTim.id
): GameEvent {
  return {
    id,
    gameId: utakmica.id,
    playerId,
    teamId,
    quarter: 1,
    minute,
    second: 0,
    type: EventType.SUBSTITUTION,
    direction
  };
}

function pocetnaPetorka(): readonly GameEvent[] {
  return [7, 8, 9, 10, 11].map((playerId, redniBroj) =>
    izmjena(redniBroj + 1, playerId, 10, SubstitutionDirection.IN)
  );
}

describe("izvođenje sastava iz izmjena", () => {
  it("šesti igrač istog tima na terenu prekida izračun", () => {
    const dogadaji = [...pocetnaPetorka(), izmjena(6, 12, 8, SubstitutionDirection.IN)];

    expect(() => kalkulator.calculate(kontekst, dogadaji)).toThrow(InvalidEventSequenceError);
  });

  it("pogreška nosi identifikator igrača i događaja na kojem je otkrivena", () => {
    const dogadaji = [...pocetnaPetorka(), izmjena(6, 12, 8, SubstitutionDirection.IN)];
    let uhvacena: unknown = null;

    try {
      kalkulator.calculate(kontekst, dogadaji);
    } catch (pogreska) {
      uhvacena = pogreska;
    }

    expect(uhvacena).toBeInstanceOf(InvalidEventSequenceError);

    if (uhvacena instanceof InvalidEventSequenceError) {
      expect(uhvacena.playerId).toBe(12);
      expect(uhvacena.eventId).toBe(6);
    }
  });

  it("peti igrač koji zamijeni izašlog ne prekida izračun", () => {
    const dogadaji = [
      ...pocetnaPetorka(),
      izmjena(6, 11, 8, SubstitutionDirection.OUT),
      izmjena(7, 12, 8, SubstitutionDirection.IN)
    ];

    expect(kalkulator.calculate(kontekst, dogadaji).playedSeconds).toBe(2400);
  });

  it("zamjena u istoj sekundi ne daje šest igrača ni kad je ulazak zapisan prvi", () => {
    const modul = new StatisticsEngine();
    modul.registerPlayerCalculator(kalkulator);

    const dogadaji = [
      ...pocetnaPetorka(),
      izmjena(6, 12, 8, SubstitutionDirection.IN),
      izmjena(7, 11, 8, SubstitutionDirection.OUT)
    ];

    expect(modul.calculatePlayerStats(kontekst, dogadaji).boxScore?.playedSeconds).toBe(2400);
  });

  it("šesti igrač drugog tima ne prekida izračun", () => {
    const gost: Player = { ...igrac7, id: 21, teamId: gostujuciTim.id };
    const dogadaji = [
      ...pocetnaPetorka(),
      izmjena(6, gost.id, 10, SubstitutionDirection.IN, gostujuciTim.id)
    ];

    const sazetak = kalkulator.calculate({ game: utakmica, player: gost }, dogadaji);

    expect(sazetak.playedSeconds).toBe(2400);
  });

  it("ulazak igrača koji je već na terenu prekida izračun", () => {
    const dogadaji = [...pocetnaPetorka(), izmjena(6, 7, 8, SubstitutionDirection.IN)];

    expect(() => kalkulator.calculate(kontekst, dogadaji)).toThrow(InvalidEventSequenceError);
  });

  it("izlazak igrača koji nije na terenu prekida izračun", () => {
    const dogadaji = [izmjena(1, 7, 5, SubstitutionDirection.OUT)];

    expect(() => kalkulator.calculate(kontekst, dogadaji)).toThrow(InvalidEventSequenceError);
  });
});
