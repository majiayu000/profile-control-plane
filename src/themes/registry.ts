import { ProfileError } from "../core/errors.js";
import type { ThemeDefinition, ThemePreset } from "../core/types.js";
import { BentoGridRenderer } from "./bento-grid/bento-grid.js";
import { BlueprintRenderer } from "./blueprint/blueprint.js";
import { CartographRenderer } from "./cartograph/cartograph.js";
import { CipherPrintRenderer } from "./cipher-print/cipher-print.js";
import { CommandDeckRenderer } from "./command-deck/command-deck.js";
import { ConstellationRenderer } from "./constellation/constellation.js";
import { ControlPlaneRenderer } from "./control-plane/control-plane.js";
import { EditorialRenderer } from "./editorial/editorial.js";
import { FieldSpecimenRenderer } from "./field-specimen/field-specimen.js";
import { FoundryRenderer } from "./foundry/foundry.js";
import { InterlaceRenderer } from "./interlace/interlace.js";
import { MetroRenderer } from "./metro/metro.js";
import { MonolithRenderer } from "./monolith/monolith.js";
import { PatchbayRenderer } from "./patchbay/patchbay.js";
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
  "monolith",
  "interlace",
  "cipher-print",
  "field-specimen",
  "patchbay",
  "cartograph",
  "foundry",
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
  monolith: {
    preset: "monolith",
    label: "Monolith",
    description:
      "A stark internationalist poster built from type, mass, and proof.",
    renderer: new MonolithRenderer(),
    copy: {
      flagshipHeading: "Selected proofs",
      overviewHeading: "Typographic route",
      modulesHeading: "Complete index",
      emptyModules: "No additional work selected.",
      heroAlt: (config) => `${config.identity.name} monolith poster`,
      overviewAlt: (config) => `${config.identity.name} typographic route`,
    },
  },
  interlace: {
    preset: "interlace",
    label: "Interlace",
    description:
      "A quiet project loom for work connected across layers and disciplines.",
    renderer: new InterlaceRenderer(),
    copy: {
      flagshipHeading: "Anchor threads",
      overviewHeading: "Project weave",
      modulesHeading: "Thread archive",
      emptyModules: "No additional threads selected.",
      heroAlt: (config) => `${config.identity.name} interlaced portfolio`,
      overviewAlt: (config) => `${config.identity.name} project weave`,
    },
  },
  "cipher-print": {
    preset: "cipher-print",
    label: "Cipher Print",
    description: "An engraved folio for meticulous systems and enduring craft.",
    renderer: new CipherPrintRenderer(),
    copy: {
      flagshipHeading: "Registered works",
      overviewHeading: "Engraved index",
      modulesHeading: "Edition ledger",
      emptyModules: "No additional impressions registered.",
      heroAlt: (config) => `${config.identity.name} cipher print folio`,
      overviewAlt: (config) => `${config.identity.name} engraved index`,
    },
  },
  "field-specimen": {
    preset: "field-specimen",
    label: "Field Specimen",
    description:
      "A natural-history plate for exploratory, branching bodies of work.",
    renderer: new FieldSpecimenRenderer(),
    copy: {
      flagshipHeading: "Reference specimens",
      overviewHeading: "Classification plate",
      modulesHeading: "Specimen catalog",
      emptyModules: "No additional specimens cataloged.",
      heroAlt: (config) => `${config.identity.name} field specimen plate`,
      overviewAlt: (config) => `${config.identity.name} classification plate`,
    },
  },
  patchbay: {
    preset: "patchbay",
    label: "Patch Bay",
    description:
      "A modular patch panel for tools wired into one routed signal path.",
    renderer: new PatchbayRenderer(),
    copy: {
      flagshipHeading: "Patched channels",
      overviewHeading: "Cable routing",
      modulesHeading: "Jack field",
      emptyModules: "No spare jacks wired.",
      heroAlt: (config) => `${config.identity.name} patch bay`,
      overviewAlt: (config) => `${config.identity.name} cable routing`,
    },
  },
  cartograph: {
    preset: "cartograph",
    label: "Cartograph",
    description:
      "A topographic survey for work charted across domains and terrain.",
    renderer: new CartographRenderer(),
    copy: {
      flagshipHeading: "Surveyed summits",
      overviewHeading: "Contour survey",
      modulesHeading: "Gazetteer",
      emptyModules: "No gazetteer entries.",
      heroAlt: (config) => `${config.identity.name} survey map`,
      overviewAlt: (config) => `${config.identity.name} contour survey`,
    },
  },
  foundry: {
    preset: "foundry",
    label: "Foundry",
    description:
      "A casting floor for hardened tools that are forged and shipped.",
    renderer: new FoundryRenderer(),
    copy: {
      flagshipHeading: "Master casts",
      overviewHeading: "Casting floor",
      modulesHeading: "Alloy stock",
      emptyModules: "No alloy in stock.",
      heroAlt: (config) => `${config.identity.name} foundry floor`,
      overviewAlt: (config) => `${config.identity.name} casting floor`,
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
