import { describe, expect, it } from "vitest";
import { EventType, Position, SubstitutionDirection } from "@ibozak23/kosarkaska-analitika";

import { procitajUtakmicu } from "../src/app/uvoz/citanje-utakmice.js";
import { provjeriUtakmicu } from "../src/app/uvoz/provjera-uvoza.js";
import { sastaviZahtjevUvoza } from "../src/app/uvoz/sastavljanje-zahtjeva.js";
import type { PogreskaUvoza } from "../src/app/uvoz/model-uvoza.js";

const ZAGLAVLJE = [
  "# proba uvoza",
  "UTAKMICA;2026-03-14T19:00",
  "TIM;DOMACI;Sokolovi Probni;Cakovec;Probna liga;2025/2026",
  "TIM;GOSTI;Drava Probna;;Probna liga;2025/2026",
  "IGRAC;DOMACI;4;Luka;Horvat;PG;184",
  "IGRAC;DOMACI;5;Marko;Novak;SG;190",
  "IGRAC;DOMACI;6;Ivan;Kovac;SF;198",
  "IGRAC;DOMACI;7;Petar;Juric;PF;203",
  "IGRAC;DOMACI;8;Tomo;Babic;C;207",
  "IGRAC;DOMACI;9;Filip;Matic;SG;188",
  "IGRAC;GOSTI;11;Josip;Vukic;PG;182",
  "IGRAC;GOSTI;12;Ante;Peric;SG;191",
  "IGRAC;GOSTI;13;Mate;Sarac;SF;196",
  "IGRAC;GOSTI;14;Karlo;Blazevic;PF;202",
  "IGRAC;GOSTI;15;Bruno;Lovric;C;209",
  "IGRAC;GOSTI;16;Dino;Klaric;SF;195",
  "POCETNA;DOMACI;4;5;6;7;8",
  "POCETNA;GOSTI;11;12;13;14;15"
];

const DOGADJAJI = [
  "DOGADJAJ;1;9;51;DOMACI;7;SHOT;3;DA;",
  "DOGADJAJ;1;9;51;DOMACI;4;ASSIST;;;",
  "DOGADJAJ;2;5;36;DOMACI;4;SUBSTITUTION;;;OUT",
  "DOGADJAJ;2;5;36;DOMACI;9;SUBSTITUTION;;;IN",
  "DOGADJAJ;4;0;30;GOSTI;11;SHOT;2;NE;"
];

function datoteka(dogadjaji: readonly string[] = DOGADJAJI): string {
  return [...ZAGLAVLJE, ...dogadjaji].join("\r\n");
}

function pogreskeZa(tekst: string): PogreskaUvoza[] {
  const ishod = procitajUtakmicu(tekst);

  return [...ishod.pogreske, ...provjeriUtakmicu(ishod.utakmica)];
}

function porukeZa(tekst: string): string {
  return pogreskeZa(tekst)
    .map((pogreska) => pogreska.poruka)
    .join(" | ");
}

describe("čitanje CSV datoteke utakmice", () => {
  it("čita ispravnu datoteku bez pogreške", () => {
    const ishod = procitajUtakmicu(datoteka());

    expect(ishod.pogreske).toEqual([]);
    expect(provjeriUtakmicu(ishod.utakmica)).toEqual([]);
    expect(ishod.utakmica.timovi).toHaveLength(2);
    expect(ishod.utakmica.igraci).toHaveLength(12);
    expect(ishod.utakmica.petorke).toHaveLength(2);
    expect(ishod.utakmica.dogadjaji).toHaveLength(DOGADJAJI.length);
  });

  it("preskače oznaku BOM, prazne redke i komentare", () => {
    const ishod = procitajUtakmicu(`\uFEFF${datoteka()}\r\n\r\n# kraj\r\n`);

    expect(ishod.pogreske).toEqual([]);
    expect(ishod.utakmica.odigranoU).toBe("2026-03-14T19:00");
  });

  it("čita vrijednost u navodnicima zajedno s razdjelnikom", () => {
    const ishod = procitajUtakmicu(
      [
        "UTAKMICA;2026-03-14T19:00",
        "TIM;DOMACI;\"Sokolovi; Cakovec\";Cakovec;Probna liga;2025/2026"
      ].join("\n")
    );

    expect(ishod.utakmica.timovi[0]?.naziv).toBe("Sokolovi; Cakovec");
  });

  it("javlja broj retka za nepoznatu vrstu retka", () => {
    const pogreske = pogreskeZa([...ZAGLAVLJE, "STATISTIKA;1;2"].join("\n"));

    expect(pogreske[0]?.redak).toBe(ZAGLAVLJE.length + 1);
    expect(pogreske[0]?.poruka).toContain("Nepoznata vrsta retka");
  });

  it("odbija nepoznat tip događaja", () => {
    expect(porukeZa(datoteka(["DOGADJAJ;1;9;51;DOMACI;7;KOS;;;"]))).toContain("Stupac tip mora biti");
  });

  it("odbija šut bez broja poena", () => {
    expect(porukeZa(datoteka(["DOGADJAJ;1;9;51;DOMACI;7;SHOT;;DA;"]))).toContain("Stupac poeni");
  });

  it("odbija poene upisane uz tip koji ih nema", () => {
    expect(porukeZa(datoteka(["DOGADJAJ;1;9;51;DOMACI;7;ASSIST;2;;"]))).toContain("samo za tip SHOT");
  });

  it("odbija događaj igrača kojega nema u sastavu", () => {
    expect(porukeZa(datoteka(["DOGADJAJ;1;9;51;DOMACI;77;ASSIST;;;"]))).toContain("nije upisan u sastav");
  });

  it("odbija sekundu izvan raspona semafora", () => {
    expect(porukeZa(datoteka(["DOGADJAJ;1;9;75;DOMACI;7;ASSIST;;;"]))).toContain("Vrijeme na semaforu");
  });

  it("odbija početnu petorku s četiri igrača", () => {
    const tekst = [...ZAGLAVLJE.filter((redak) => redak !== "POCETNA;DOMACI;4;5;6;7;8"), "POCETNA;DOMACI;4;5;6;7"].join("\n");

    expect(porukeZa(tekst)).toContain("mora imati točno 5 igrača");
  });

  it("odbija ulazak početne petorke zapisan kao događaj", () => {
    expect(porukeZa(datoteka(["DOGADJAJ;1;10;0;DOMACI;4;SUBSTITUTION;;;IN"]))).toContain(
      "nastaje iz retka POCETNA"
    );
  });

  it("odbija dvaput upisan isti broj dresa", () => {
    const tekst = [...ZAGLAVLJE, "IGRAC;DOMACI;4;Drugi;Igrac;PG;180"].join("\n");

    expect(porukeZa(tekst)).toContain("već je zauzet u sastavu");
  });
});

describe("sastavljanje zahtjeva uvoza", () => {
  it("prevodi model u tijelo zahtjeva sučelja REST", () => {
    const zahtjev = sastaviZahtjevUvoza(procitajUtakmicu(datoteka()).utakmica);

    expect(zahtjev.playedAt).toBe(new Date("2026-03-14T19:00").toISOString());
    expect(zahtjev.home.team.name).toBe("Sokolovi Probni");
    expect(zahtjev.away.team.city).toBeNull();
    expect(zahtjev.home.players).toHaveLength(6);
    expect(zahtjev.home.starters).toEqual([4, 5, 6, 7, 8]);
    expect(zahtjev.home.players[0]).toEqual({
      jerseyNumber: 4,
      firstName: "Luka",
      lastName: "Horvat",
      position: Position.PG,
      heightCm: 184
    });
  });

  it("prenosi polja koja ovise o tipu događaja", () => {
    const zahtjev = sastaviZahtjevUvoza(procitajUtakmicu(datoteka()).utakmica);

    expect(zahtjev.events[0]).toEqual({
      side: "HOME",
      jerseyNumber: 7,
      quarter: 1,
      minute: 9,
      second: 51,
      type: EventType.SHOT,
      points: 3,
      made: true
    });

    expect(zahtjev.events[2]).toEqual({
      side: "HOME",
      jerseyNumber: 4,
      quarter: 2,
      minute: 5,
      second: 36,
      type: EventType.SUBSTITUTION,
      direction: SubstitutionDirection.OUT
    });

    expect(zahtjev.events[1]).toEqual({
      side: "HOME",
      jerseyNumber: 4,
      quarter: 1,
      minute: 9,
      second: 51,
      type: EventType.ASSIST
    });
  });
});
