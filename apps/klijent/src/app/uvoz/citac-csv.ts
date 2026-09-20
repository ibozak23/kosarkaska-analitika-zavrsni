export interface RedakCsv {
  readonly redak: number;
  readonly celije: readonly string[];
}

const OZNAKA_KOMENTARA = "#";
const NAVODNIK = "\"";
const TOCKA_ZAREZ = ";";
const ZAREZ = ",";

export function odrediRazdjelnik(tekst: string): string {
  let tockeZareza = 0;
  let zarezi = 0;

  for (const znak of tekst) {
    if (znak === TOCKA_ZAREZ) {
      tockeZareza += 1;
    } else if (znak === ZAREZ) {
      zarezi += 1;
    }
  }

  return zarezi > tockeZareza ? ZAREZ : TOCKA_ZAREZ;
}

function jePrazan(celije: readonly string[]): boolean {
  return celije.every((celija) => celija.length === 0);
}

function jeKomentar(celije: readonly string[]): boolean {
  return (celije[0] ?? "").startsWith(OZNAKA_KOMENTARA);
}

export function procitajCsv(tekst: string): RedakCsv[] {
  const sadrzaj = tekst.replace(/^\uFEFF/u, "").replace(/\r\n?/gu, "\n");
  const razdjelnik = odrediRazdjelnik(sadrzaj);

  const redci: RedakCsv[] = [];
  let celije: string[] = [];
  let trenutna = "";
  let uNavodnicima = false;
  let brojRetka = 1;
  let pocetakRetka = 1;

  function zavrsiRedak(): void {
    celije.push(trenutna);
    trenutna = "";

    const ociscene = celije.map((celija) => celija.trim());
    celije = [];

    if (!jePrazan(ociscene) && !jeKomentar(ociscene)) {
      redci.push({ redak: pocetakRetka, celije: ociscene });
    }
  }

  for (let mjesto = 0; mjesto < sadrzaj.length; mjesto += 1) {
    const znak = sadrzaj.charAt(mjesto);

    if (uNavodnicima) {
      if (znak !== NAVODNIK) {
        if (znak === "\n") {
          brojRetka += 1;
        }

        trenutna += znak;
        continue;
      }

      if (sadrzaj.charAt(mjesto + 1) === NAVODNIK) {
        trenutna += NAVODNIK;
        mjesto += 1;
        continue;
      }

      uNavodnicima = false;
      continue;
    }

    if (znak === NAVODNIK) {
      uNavodnicima = true;
      continue;
    }

    if (znak === razdjelnik) {
      celije.push(trenutna);
      trenutna = "";
      continue;
    }

    if (znak === "\n") {
      zavrsiRedak();
      brojRetka += 1;
      pocetakRetka = brojRetka;
      continue;
    }

    trenutna += znak;
  }

  if (trenutna.length > 0 || celije.length > 0) {
    zavrsiRedak();
  }

  return redci;
}
