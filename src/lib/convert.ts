export const GRAMS_PER_OZ = 28.3495

export function gramsToOz(grams: number): string {
  return (grams / GRAMS_PER_OZ).toFixed(2)
}
