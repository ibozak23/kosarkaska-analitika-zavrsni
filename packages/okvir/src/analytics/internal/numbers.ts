// Zaokruživanje i postotak. 
export const RESULT_DECIMALS = 3;

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}

export function percentage(made: number, attempted: number): number | null {
  if (attempted === 0) {
    return null;
  }

  return roundTo(made / attempted, RESULT_DECIMALS);
}
