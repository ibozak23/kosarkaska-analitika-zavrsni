
function oblikujDvoznamenkasto(broj: number): string {
  return broj.toString().padStart(2, "0");
}

export function oblikujDatumIVrijeme(zapisDatuma: string): string {
  const datum = new Date(zapisDatuma);

  return `${oblikujDvoznamenkasto(datum.getDate())}.${oblikujDvoznamenkasto(datum.getMonth() + 1)}.${String(datum.getFullYear())}. ${oblikujDvoznamenkasto(datum.getHours())}:${oblikujDvoznamenkasto(datum.getMinutes())}`;
}

export function oblikujVrijemeSemafora(cetvrtina: number, minuta: number, sekunda: number): string {
  return `${String(cetvrtina)}. četvrtina, ${String(minuta)}:${oblikujDvoznamenkasto(sekunda)}`;
}

export function oblikujOdigranoVrijeme(sekunde: number): string {
  return `${String(Math.floor(sekunde / 60))}:${oblikujDvoznamenkasto(sekunde % 60)}`;
}

export function oblikujDecimalniBroj(vrijednost: number | null, znamenki: number): string {
  return vrijednost === null ? "—" : vrijednost.toFixed(znamenki).replace(".", ",");
}

export function oblikujPostotak(vrijednost: number | null): string {
  return vrijednost === null ? "—" : `${(vrijednost * 100).toFixed(1).replace(".", ",")} %`;
}

export function oblikujPogodjeneOdPokusanih(pogodjeni: number, pokusani: number, udio: number | null): string {
  return `${String(pogodjeni)}/${String(pokusani)} · ${oblikujPostotak(udio)}`;
}

export function oblikujSadasnjiTrenutakZaObrazac(): string {
  const sada = new Date();

  return `${String(sada.getFullYear())}-${oblikujDvoznamenkasto(sada.getMonth() + 1)}-${oblikujDvoznamenkasto(sada.getDate())}T${oblikujDvoznamenkasto(sada.getHours())}:${oblikujDvoznamenkasto(sada.getMinutes())}`;
}
