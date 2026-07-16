import { XMLParser, XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { compileProfile } from "../src/application/compiler.js";
import {
  badgeComponent,
  escapeMarkdownCell,
  escapeMarkdownLabel,
  escapeXml,
} from "../src/core/escape.js";
import type {
  ProfileConfig,
  ThemePreset,
  ThemeRenderer,
} from "../src/core/types.js";
import { createPalette } from "../src/themes/control-plane/palette.js";
import { THEME_PRESETS } from "../src/themes/registry.js";
import { getThemeDefinition } from "../src/themes/registry.js";
import * as publicApi from "../src/index.js";
import { validConfig } from "./fixtures.js";

describe("profile compiler", () => {
  it("produces deterministic valid dark/light assets and README references", () => {
    const first = compileProfile(validConfig);
    const second = compileProfile(validConfig);
    expect(first).toEqual(second);
    expect(first.files.map((file) => file.path)).toEqual([
      "assets/hero-dark.svg",
      "assets/hero-light.svg",
      "assets/closed-loop-dark.svg",
      "assets/closed-loop-light.svg",
      "README.md",
    ]);
    for (const file of first.files.filter((candidate) =>
      candidate.path.endsWith(".svg"),
    )) {
      expect(XMLValidator.validate(file.content)).toBe(true);
      expect(
        new XMLParser({ ignoreAttributes: false }).parse(file.content),
      ).toHaveProperty("svg");
    }
    expect(first.files.at(-1)?.content).toContain("prefers-color-scheme: dark");
  });

  it("renders every declared template with distinct visuals and copy", () => {
    const expectedHeadings = new Map([
      ["control-plane", "## Flagship systems"],
      ["editorial", "## Selected work"],
      ["bento-grid", "## Featured builds"],
      ["terminal", "## Foreground jobs"],
      ["blueprint", "## Primary assemblies"],
      ["constellation", "## Brightest stars"],
      ["metro", "## Interchange stations"],
      ["command-deck", "## Mission-critical systems"],
      ["signal-grid", "## Primary signals"],
    ]);
    const heroes = THEME_PRESETS.map((preset) => {
      const output = compileProfile({
        ...validConfig,
        theme: { ...validConfig.theme, preset },
      });
      const hero = output.files.find(
        (file) => file.path === "assets/hero-dark.svg",
      );
      const readme = output.files.find((file) => file.path === "README.md");
      expect(hero?.content).toContain(`data-mode="dark"`);
      expect(readme?.content).toContain(expectedHeadings.get(preset));
      return hero?.content;
    });
    expect(new Set(heroes).size).toBe(THEME_PRESETS.length);
  });

  it("wires visible, staggered motion into the control-plane hero", () => {
    const hero =
      compileProfile(validConfig).files.find(
        (file) => file.path === "assets/hero-dark.svg",
      )?.content ?? "";

    expect(hero).toContain("@keyframes scan");
    expect(hero).toContain('class="scan"');
    expect(hero).toContain('class="flow"');
    expect(hero.match(/class="node"/g)).toHaveLength(validConfig.layers.length);
    expect(hero).toContain("animation-delay:.32s");
    expect(hero).toContain("prefers-reduced-motion:reduce");
  });

  it("renders distinct signature motion for control-plane, metro, and constellation", () => {
    const asset = (preset: ThemePreset, path: string): string =>
      compileProfile({
        ...validConfig,
        theme: { ...validConfig.theme, preset },
      }).files.find((file) => file.path === path)?.content ?? "";

    const controlHero = asset("control-plane", "assets/hero-dark.svg");
    const controlLoop = asset("control-plane", "assets/closed-loop-dark.svg");
    expect(controlHero).toContain("@keyframes boot");
    expect(controlHero).toContain('class="boot"');
    expect(controlLoop.match(/class="packet"/g)).toHaveLength(2);

    const metroHero = asset("metro", "assets/hero-dark.svg");
    const metroLoop = asset("metro", "assets/closed-loop-dark.svg");
    expect(metroHero).toContain("@keyframes train");
    expect(metroHero.match(/class="train"/g)).toHaveLength(3);
    expect(metroLoop).toContain('class="train"');

    const constellationHero = asset("constellation", "assets/hero-dark.svg");
    const constellationLoop = asset(
      "constellation",
      "assets/closed-loop-dark.svg",
    );
    expect(constellationHero).toContain("@keyframes signal");
    expect(constellationHero).toContain('class="signal"');
    expect(constellationHero.match(/class="major"/g)).toHaveLength(
      validConfig.layers.length,
    );
    expect(constellationLoop).toContain('class="signal"');

    for (const svg of [
      controlHero,
      controlLoop,
      metroHero,
      metroLoop,
      constellationHero,
      constellationLoop,
    ]) {
      expect(svg).toContain("prefers-reduced-motion:reduce");
    }
  });

  it("renders each new template's signature structure", () => {
    const signatures = new Map([
      ["terminal", ["whoami", "tree layers"]],
      ["blueprint", [">PART<", ">SPEC<"]],
      ["constellation", ["LEGEND", "STAR"]],
      ["metro", ["NETWORK MAP", "DEPOT"]],
      ["command-deck", ["COMMAND_DECK", "COMMAND BUS"]],
      ["signal-grid", ["SIGNAL_GRID", "NETWORK TOPOLOGY"]],
    ]);
    for (const [preset, probes] of signatures) {
      const output = compileProfile({
        ...validConfig,
        theme: { ...validConfig.theme, preset: preset as ThemePreset },
      });
      const svg = output.files
        .filter((file) => file.path.endsWith("-dark.svg"))
        .map((file) => file.content)
        .join("");
      for (const probe of probes ?? []) expect(svg).toContain(probe);
    }
  });

  it("rejects unsupported presets at the public registry boundary", () => {
    expect(() => getThemeDefinition("unknown" as never)).toThrow(
      /unsupported theme preset/,
    );
  });

  it("escapes untrusted SVG and Markdown content", () => {
    const hostile = {
      ...validConfig,
      identity: {
        ...validConfig.identity,
        name: '<script onload="x">',
        tagline: "<img src=x> [boom] | ok",
      },
      flagships: [
        {
          ...validConfig.flagships[0]!,
          description: "<script>alert(1)</script> | [link]",
        },
      ],
      module_groups: [],
    } satisfies ProfileConfig;
    for (const preset of THEME_PRESETS) {
      const output = compileProfile({
        ...hostile,
        theme: { ...hostile.theme, preset },
      });
      const combined = output.files.map((file) => file.content).join("\n");
      expect(combined).not.toContain("<script onload");
      expect(combined).toContain("&lt;script");
      expect(
        output.files.find((file) => file.path === "README.md")?.content,
      ).toContain("\\<img src=x\\>");
    }
  });

  it("handles long single-word headlines, ten layers, and disabled optional sections", () => {
    const layers = Array.from({ length: 10 }, (_, index) => ({
      name: `NODE ${index}`,
      project: `repository-with-a-very-long-name-${index}`,
      description: "",
      tone: index < 5 ? ("primary" as const) : ("secondary" as const),
    }));
    const config: ProfileConfig = {
      ...validConfig,
      identity: {
        ...validConfig.identity,
        headline: "X".repeat(48),
        tagline: "Y".repeat(350),
      },
      links: [],
      layers,
      module_groups: [],
      settings: { show_stars: false, show_badges: false },
    };
    for (const preset of THEME_PRESETS) {
      const readme =
        compileProfile({
          ...config,
          theme: { ...config.theme, preset },
        }).files.find((file) => file.path === "README.md")?.content ?? "";
      expect(readme).not.toContain("img.shields.io/badge/profile");
      expect(readme).not.toContain("img.shields.io/github/stars");
    }
  });

  it("keeps repository hyphens intact in GitHub and Shields paths", () => {
    const output = compileProfile({
      ...validConfig,
      flagships: [
        {
          ...validConfig.flagships[0]!,
          repo: "claude-skill-registry",
        },
      ],
    });
    const readme = output.files.at(-1)?.content ?? "";
    expect(readme).toContain(
      "github/stars/octocat/claude-skill-registry?style=flat-square",
    );
    expect(readme).not.toContain("claude--skill--registry");
  });

  it("rejects malformed, non-SVG, and active renderer output", () => {
    const renderer = (content: string): ThemeRenderer => ({
      renderHero: () => content,
      renderLoop: () => content,
    });
    expect(() => compileProfile(validConfig, renderer("<svg>"))).toThrow(
      /invalid/,
    );
    expect(() => compileProfile(validConfig, renderer("<root/>"))).toThrow(
      /not an SVG/,
    );
    expect(() =>
      compileProfile(
        validConfig,
        renderer('<svg xmlns="http://www.w3.org/2000/svg" onload="x"/>'),
      ),
    ).toThrow(/unsafe/);
  });
});

describe("escaping and palette utilities", () => {
  it("escapes each output boundary", () => {
    expect(escapeXml(`<&>"'`)).toBe("&lt;&amp;&gt;&quot;&apos;");
    expect(escapeMarkdownCell("a|b\n<c>")).toBe("a\\|b \\<c\\>");
    expect(escapeMarkdownLabel("[a]\\b")).toBe("\\[a\\]\\\\b");
    expect(badgeComponent("a-b_c")).toBe("a--b__c");
  });

  it("creates distinct dark and light palettes and exposes the public API", () => {
    expect(createPalette(validConfig, "dark").background).not.toBe(
      createPalette(validConfig, "light").background,
    );
    expect(publicApi.compileProfile).toBeTypeOf("function");
    expect(publicApi.ControlPlaneRenderer).toBeTypeOf("function");
    expect(publicApi.EditorialRenderer).toBeTypeOf("function");
    expect(publicApi.BentoGridRenderer).toBeTypeOf("function");
    expect(publicApi.TerminalRenderer).toBeTypeOf("function");
    expect(publicApi.BlueprintRenderer).toBeTypeOf("function");
    expect(publicApi.ConstellationRenderer).toBeTypeOf("function");
    expect(publicApi.MetroRenderer).toBeTypeOf("function");
    expect(publicApi.CommandDeckRenderer).toBeTypeOf("function");
    expect(publicApi.SignalGridRenderer).toBeTypeOf("function");
    expect(publicApi.THEME_PRESETS).toEqual(THEME_PRESETS);
  });
});
