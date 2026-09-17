/**
 * The four accents rotate in list order so no two neighbours match.
 * Colour is decoration, never meaning — see design/studiolo-theme.css.
 */
const ACCENTS = ["accent-violet", "accent-red", "accent-green", "accent-orange"] as const;

export function accentFor(index: number): string {
  return ACCENTS[((index % 4) + 4) % 4];
}
