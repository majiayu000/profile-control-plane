import { ProfileError } from "../core/errors.js";
import type { ThemeDefinition, ThemePreset } from "../core/types.js";
import { BentoGridRenderer } from "./bento-grid/bento-grid.js";
import { BlueprintRenderer } from "./blueprint/blueprint.js";
import { CommandDeckRenderer } from "./command-deck/command-deck.js";
import { ConstellationRenderer } from "./constellation/constellation.js";
import { ControlPlaneRenderer } from "./control-plane/control-plane.js";
import { EditorialRenderer } from "./editorial/editorial.js";
import { MetroRenderer } from "./metro/metro.js";
import { SignalGridRenderer } from "./signal-grid/signal-grid.js";
import { TerminalRenderer } from "./terminal/terminal.js";

export const THEME_PRESETS = [
  "control-plane",
  "command-deck",
  "signal-grid",
  "editorial",
  "bento-grid",
  "terminal",
  "blueprint",
  "constellation",
  "metro",
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
  editorial: {
    preset: "editorial",
    label: "Editorial",
    description: "A restrained, typographic portfolio for selected work.",
    renderer: new EditorialRenderer(),
    copy: {
      flagshipHeading: "Selected work",
      overviewHeading: "Working index",
      modulesHeading: "Project archive",
      emptyModules: "No supporting projects selected.",
      heroAlt: (config) => `${config.identity.name} editorial profile`,
      overviewAlt: (config) => `${config.identity.name} project index`,
    },
  },
  "bento-grid": {
    preset: "bento-grid",
    label: "Developer Workbench",
    description:
      "A connected modular workbench for builders and product systems.",
    renderer: new BentoGridRenderer(),
    copy: {
      flagshipHeading: "Featured builds",
      overviewHeading: "Build map",
      modulesHeading: "More from the workshop",
      emptyModules: "No additional builds selected.",
      heroAlt: (config) => `${config.identity.name} bento portfolio`,
      overviewAlt: (config) => `${config.identity.name} modular build map`,
    },
  },
  terminal: {
    preset: "terminal",
    label: "Terminal",
    description: "A live shell session for CLI tools and daemon builders.",
    renderer: new TerminalRenderer(),
    copy: {
      flagshipHeading: "Foreground jobs",
      overviewHeading: "Process tree",
      modulesHeading: "Background jobs",
      emptyModules: "No background jobs.",
      heroAlt: (config) => `${config.identity.name} terminal session`,
      overviewAlt: (config) => `${config.identity.name} process tree`,
    },
  },
  blueprint: {
    preset: "blueprint",
    label: "Blueprint",
    description: "An engineering drawing for deliberate, spec-driven work.",
    renderer: new BlueprintRenderer(),
    copy: {
      flagshipHeading: "Primary assemblies",
      overviewHeading: "Assembly drawing",
      modulesHeading: "Parts index",
      emptyModules: "No auxiliary parts.",
      heroAlt: (config) => `${config.identity.name} engineering blueprint`,
      overviewAlt: (config) => `${config.identity.name} assembly drawing`,
    },
  },
  constellation: {
    preset: "constellation",
    label: "Constellation",
    description: "A star chart for a broad body of connected work.",
    renderer: new ConstellationRenderer(),
    copy: {
      flagshipHeading: "Brightest stars",
      overviewHeading: "Star chart",
      modulesHeading: "Deep-sky catalog",
      emptyModules: "No catalog entries.",
      heroAlt: (config) => `${config.identity.name} constellation`,
      overviewAlt: (config) => `${config.identity.name} star chart`,
    },
  },
  metro: {
    preset: "metro",
    label: "Metro Map",
    description: "A transit network for many repositories on clear lines.",
    renderer: new MetroRenderer(),
    copy: {
      flagshipHeading: "Interchange stations",
      overviewHeading: "Network map",
      modulesHeading: "Line directory",
      emptyModules: "No lines in service.",
      heroAlt: (config) => `${config.identity.name} metro map`,
      overviewAlt: (config) => `${config.identity.name} network map`,
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
