import type { ColorMode, ProfileConfig } from "../../core/types.js";

export interface Palette {
  readonly background: string;
  readonly backgroundEnd: string;
  readonly panel: string;
  readonly grid: string;
  readonly line: string;
  readonly text: string;
  readonly muted: string;
  readonly primary: string;
  readonly secondary: string;
}

export function createPalette(config: ProfileConfig, mode: ColorMode): Palette {
  return mode === "dark"
    ? {
        background: "#07131A",
        backgroundEnd: "#10141F",
        panel: "#0C1C24",
        grid: "#17313C",
        line: "#2B4A57",
        text: "#E7F7FC",
        muted: "#8BA9B5",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      }
    : {
        background: "#F6FBFD",
        backgroundEnd: "#FFF6FA",
        panel: "#FFFFFF",
        grid: "#D7E7ED",
        line: "#A9C4CF",
        text: "#102934",
        muted: "#506D7A",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      };
}
