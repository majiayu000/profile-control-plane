import { ProfileError } from "../core/errors.js";
import type { ThemeDefinition, ThemePreset } from "../core/types.js";
import { BentoGridRenderer } from "./bento-grid/bento-grid.js";
import { ControlPlaneRenderer } from "./control-plane/control-plane.js";
import { EditorialRenderer } from "./editorial/editorial.js";

export const THEME_PRESETS = [
  "control-plane",
  "editorial",
  "bento-grid",
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
