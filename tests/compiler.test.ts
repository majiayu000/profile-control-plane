import { XMLParser, XMLValidator } from "fast-xml-parser";
import { describe, expect, it } from "vitest";
import { compileProfile } from "../src/application/compiler.js";
import {
  badgeComponent,
  escapeMarkdownCell,
  escapeMarkdownLabel,
  escapeXml,
} from "../src/core/escape.js";
import type { ProfileConfig, ThemeRenderer } from "../src/core/types.js";
import { createPalette } from "../src/themes/control-plane/palette.js";
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
    const output = compileProfile(hostile);
    const combined = output.files.map((file) => file.content).join("\n");
    expect(combined).not.toContain("<script onload");
    expect(combined).toContain("&lt;script");
    expect(
      output.files.find((file) => file.path === "README.md")?.content,
    ).toContain("\\<img src=x\\>");
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
    const readme =
      compileProfile(config).files.find((file) => file.path === "README.md")
        ?.content ?? "";
    expect(readme).not.toContain("img.shields.io/badge/profile");
    expect(readme).not.toContain("img.shields.io/github/stars");
    expect(readme).toContain("No modules declared.");
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
  });
});
