import { Component, signal } from "@angular/core";
import type { OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { GameStatus } from "@ibozak23/kosarkaska-analitika";
import type { Player } from "@ibozak23/kosarkaska-analitika";

import { ServisSuceljaRest } from "../servisi/servis-sucelja-rest.js";
import type { OdgovorSazetkaTima, OdgovorSazetkaUtakmice, OdgovorUtakmice } from "../servisi/tipovi-sucelja-rest.js";
import { porukaPogreske } from "./poruka-pogreske.js";
import { oblikujDatumIVrijeme } from "./oblikovanje.js";

const REDAKA_NA_KARTICI = 5;

interface NedavnaUtakmica {
  readonly id: number;
  readonly playedAt: string;
  readonly domaci: string;
  readonly gosti: string;
  readonly rezultat: string;
}

interface RedakPoretka {
  readonly teamId: number;
  readonly naziv: string;
  readonly odigrano: number;
  readonly pobjede: number;
  readonly postignuto: number;
  readonly primljeno: number;
}

interface RedakStrijelaca {
  readonly playerId: number;
  readonly ime: string;
  readonly tim: string;
  readonly poeni: number;
}

interface StavkaGrafa {
  readonly oznaka: string;
  readonly vrijednost: number;
  readonly udio: number;
}

@Component({
  selector: "zaslon-nadzorna-ploca",
  imports: [RouterLink],
  templateUrl: "./zaslon-nadzorne-ploce.html"
})
export class ZaslonNadzornePloce implements OnInit {
  protected readonly poredakTimova = signal<readonly RedakPoretka[]>([]);
  protected readonly listaStrijelaca = signal<readonly RedakStrijelaca[]>([]);
  protected readonly nedavneUtakmice = signal<readonly NedavnaUtakmica[]>([]);
  protected readonly grafPoenaTimova = signal<readonly StavkaGrafa[]>([]);
  protected readonly grafStrijelaca = signal<readonly StavkaGrafa[]>([]);
  protected readonly pogreska = signal<string | null>(null);

  protected readonly oblikujDatumIVrijeme = oblikujDatumIVrijeme;

  readonly #servis: ServisSuceljaRest;

  constructor(servis: ServisSuceljaRest) {
    this.#servis = servis;
  }

  ngOnInit(): void {
    void this.#dohvatiPodatke();
  }

  async #dohvatiPodatke(): Promise<void> {
    try {
      const utakmice = await this.#servis.dohvatiUtakmice();

      const zavrsene = utakmice
        .filter((utakmica) => utakmica.status === GameStatus.FINISHED)
        .sort((a, b) => Date.parse(b.playedAt) - Date.parse(a.playedAt));

      const zapisnici = await Promise.all(
        zavrsene.map(async (utakmica) => [utakmica, await this.#servis.dohvatiSazetakUtakmice(utakmica.id)] as const)
      );

      this.nedavneUtakmice.set(sastaviNedavneUtakmice(zapisnici.slice(0, REDAKA_NA_KARTICI)));
      this.poredakTimova.set(sastaviPoredakTimova(zapisnici).slice(0, REDAKA_NA_KARTICI));
      this.listaStrijelaca.set(sastaviListuStrijelaca(zapisnici).slice(0, REDAKA_NA_KARTICI));
      this.grafPoenaTimova.set(sastaviGraf(this.poredakTimova(), (redak) => redak.naziv, (redak) => redak.postignuto));
      this.grafStrijelaca.set(sastaviGraf(this.listaStrijelaca(), (redak) => redak.ime, (redak) => redak.poeni));
    } catch (pogreska) {
      this.pogreska.set(porukaPogreske(pogreska));
    }
  }
}

function zbrojPoena(sazetak: OdgovorSazetkaTima): number {
  let poeni = 0;

  for (const redak of sazetak.players) {
    if (redak.stats.boxScore !== null) {
      poeni += redak.stats.boxScore.points;
    }
  }

  return poeni;
}

function sastaviNedavneUtakmice(
  zapisnici: readonly (readonly [OdgovorUtakmice, OdgovorSazetkaUtakmice])[]
): readonly NedavnaUtakmica[] {
  return zapisnici.map(([utakmica, sazetak]) => ({
    id: utakmica.id,
    playedAt: utakmica.playedAt,
    domaci: sazetak.home.team.name,
    gosti: sazetak.away.team.name,
    rezultat: `${String(zbrojPoena(sazetak.home))} : ${String(zbrojPoena(sazetak.away))}`
  }));
}

function sastaviPoredakTimova(
  zapisnici: readonly (readonly [OdgovorUtakmice, OdgovorSazetkaUtakmice])[]
): readonly RedakPoretka[] {
  const poTimu = new Map<number, { naziv: string; odigrano: number; pobjede: number; postignuto: number; primljeno: number }>();

  const dodajZaTim = (teamId: number, naziv: string, postignuto: number, primljeno: number): void => {
    const postojeci = poTimu.get(teamId) ?? { naziv, odigrano: 0, pobjede: 0, postignuto: 0, primljeno: 0 };

    poTimu.set(teamId, {
      naziv,
      odigrano: postojeci.odigrano + 1,
      pobjede: postojeci.pobjede + (postignuto > primljeno ? 1 : 0),
      postignuto: postojeci.postignuto + postignuto,
      primljeno: postojeci.primljeno + primljeno
    });
  };

  for (const [, sazetak] of zapisnici) {
    const poeniDomacih = zbrojPoena(sazetak.home);
    const poeniGostiju = zbrojPoena(sazetak.away);

    dodajZaTim(sazetak.home.team.id, sazetak.home.team.name, poeniDomacih, poeniGostiju);
    dodajZaTim(sazetak.away.team.id, sazetak.away.team.name, poeniGostiju, poeniDomacih);
  }

  return Array.from(poTimu.entries())
    .map(([teamId, zbroj]) => ({ teamId, ...zbroj }))
    .sort(
      (a, b) => b.pobjede - a.pobjede || b.postignuto - b.primljeno - (a.postignuto - a.primljeno)
    );
}

function sastaviListuStrijelaca(
  zapisnici: readonly (readonly [OdgovorUtakmice, OdgovorSazetkaUtakmice])[]
): readonly RedakStrijelaca[] {
  const poIgracu = new Map<number, { igrac: Player; tim: string; poeni: number }>();

  const dodajZaTim = (strana: OdgovorSazetkaTima): void => {
    for (const redak of strana.players) {
      if (redak.stats.boxScore === null) {
        continue;
      }

      const postojeci = poIgracu.get(redak.player.id);

      poIgracu.set(redak.player.id, {
        igrac: redak.player,
        tim: strana.team.name,
        poeni: (postojeci?.poeni ?? 0) + redak.stats.boxScore.points
      });
    }
  };

  for (const [, sazetak] of zapisnici) {
    dodajZaTim(sazetak.home);
    dodajZaTim(sazetak.away);
  }

  return Array.from(poIgracu.values())
    .map((zapis) => ({
      playerId: zapis.igrac.id,
      ime: `${zapis.igrac.firstName} ${zapis.igrac.lastName}`,
      tim: zapis.tim,
      poeni: zapis.poeni
    }))
    .sort((a, b) => b.poeni - a.poeni);
}

function sastaviGraf<TRedak>(
  redci: readonly TRedak[],
  oznaka: (redak: TRedak) => string,
  vrijednost: (redak: TRedak) => number
): readonly StavkaGrafa[] {
  const najveca = Math.max(0, ...redci.map(vrijednost));

  if (najveca === 0) {
    return [];
  }

  return redci.map((redak) => ({
    oznaka: oznaka(redak),
    vrijednost: vrijednost(redak),
    udio: vrijednost(redak) / najveca
  }));
}
