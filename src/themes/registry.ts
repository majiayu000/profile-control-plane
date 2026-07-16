import { ProfileError } from "../core/errors.js";
import type { ThemeDefinition, ThemePreset } from "../core/types.js";
import { CommandDeckRenderer } from "./command-deck/command-deck.js";
import { ControlPlaneRenderer } from "./control-plane/control-plane.js";
import { SignalGridRenderer } from "./signal-grid/signal-grid.js";

export const THEME_PRESETS = [
  "control-plane",
  "command-deck",
  "signal-grid",
] as const satisfies readonly ThemePreset[];

const themes: Record<ThemePreset, ThemeDefinition> = {
  "control-plane": {
    preset: "control-plane",
    label: "Control Plane",
    description: "An animated systems map for infrastructure and agent work.",
    renderer: new ControlPlaneRenderer(),
    copy: {
      flagshipHeading: "Flagship systems",
      overviewHeading: "Closed-loop architecture",
      modulesHeading: "Module registry",
      emptyModules: "No modules declared.",
      heroAlt: (config) => `${config.identity.name} profile control plane`,
      overviewAlt: (config) => `${config.identity.name} architecture map`,
    },
  },
  "command-deck": {
    preset: "command-deck",
    label: "Command Deck",
    description:
      "An operations console for flagship systems and execution status.",
    renderer: new CommandDeckRenderer(),
    copy: {
      flagshipHeading: "Mission-critical systems",
      overviewHeading: "Execution deck",
      modulesHeading: "Supporting systems",
      emptyModules: "No supporting systems declared.",
      heroAlt: (config) => `${config.identity.name} command deck`,
      overviewAlt: (config) => `${config.identity.name} execution deck`,
    },
  },
  "signal-grid": {
    preset: "signal-grid",
    label: "Signal Grid",
    description:
      "A network topology for connected projects and system relationships.",
    renderer: new SignalGridRenderer(),
    copy: {
      flagshipHeading: "Primary signals",
      overviewHeading: "Signal topology",
      modulesHeading: "Network registry",
      emptyModules: "No additional signals declared.",
      heroAlt: (config) => `${config.identity.name} signal grid`,
      overviewAlt: (config) => `${config.identity.name} signal topology`,
    },
  },
};

export function getThemeDefinition(preset: ThemePreset): ThemeDefinition {
  if (!Object.hasOwn(themes, preset)) {
    throw new ProfileError(
      "CONFIG_INVALID",
      `unsupported theme preset: ${String(preset)}`,
    );
  }
  return themes[preset];
}
