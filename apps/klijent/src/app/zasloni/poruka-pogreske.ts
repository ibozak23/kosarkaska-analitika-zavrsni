export function porukaPogreske(pogreska: unknown): string {
  return pogreska instanceof Error ? pogreska.message : "Nepoznata pogreška.";
}
