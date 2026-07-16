import type { Tone } from "../core/types.js";

export interface AccentPalette {
  readonly primary: string;
  readonly secondary: string;
}

export function toneColor(tone: Tone, palette: AccentPalette): string {
  return tone === "primary" ? palette.primary : palette.secondary;
}

export function shorten(value: string, maximumLength: number): string {
  return value.length <= maximumLength
    ? value
    : `${value.slice(0, maximumLength - 1).trimEnd()}…`;
}
