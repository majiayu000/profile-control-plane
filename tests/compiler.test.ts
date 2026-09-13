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
      ["monolith", "## Selected proofs"],
      ["interlace", "## Anchor threads"],
      ["cipher-print", "## Registered works"],
      ["field-specimen", "## Reference specimens"],
      ["patchbay", "## Patched channels"],
      ["cartograph", "## Surveyed summits"],
      ["foundry", "## Master casts"],
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
      ["monolith", ["MONOLITH / MASS STUDY", "MONOLITH / STRATA INDEX"]],
      ["interlace", ["INTERLACE / OPEN LOOM", "INTERLACE / WEAVE MAP"]],
      ["cipher-print", ["CIPHER PRINT / OPEN SYSTEMS FOLIO", "GUILLOCHÉ KEY"]],
      [
        "field-specimen",
        ["FIELD SPECIMEN / SYSTEMATIC INDEX", "CLASSIFICATION KEY"],
      ],
      ["patchbay", ["PATCH BAY / SIGNAL ROUTING", "PATCH BAY / CHANNEL MAP"]],
      [
        "cartograph",
        ["CARTOGRAPH / FIELD SURVEY", "CARTOGRAPH / CONTOUR INDEX"],
      ],
      ["foundry", ["FOUNDRY / CASTING FLOOR", "FOUNDRY / ALLOY LEDGER"]],
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

  it("rejects namespaced script, handler, and unsafe image/use href schemes", () => {
    const renderer = (content: string): ThemeRenderer => ({
      renderHero: () => content,
      renderLoop: () => content,
    });
    const ns = 'xmlns="http://www.w3.org/2000/svg"';
    const cases = [
      `<svg ${ns}><foreignObject width="1" height="1"><xhtml:script xmlns:xhtml="http://www.w3.org/1999/xhtml">alert(1)</xhtml:script></foreignObject></svg>`,
      `<svg ${ns}><xhtml:script xmlns:xhtml="http://www.w3.org/1999/xhtml">alert(1)</xhtml:script></svg>`,
      `<svg ${ns}><handler type="application/javascript">alert(1)</handler></svg>`,
      `<svg ${ns}><image href="data:image/svg+xml,payload"/></svg>`,
      `<svg ${ns}><use href="https://evil.example/x.svg"/></svg>`,
      `<svg ${ns}><image xlink:href="javascript:alert(1)"/></svg>`,
      `<svg ${ns}><a href="https://evil.example/"/></svg>`,
      `<svg ${ns}><embed src="https://evil.example/x"/></svg>`,
      `<svg ${ns}><image href="\\\\evil.example/pixel"/></svg>`,
      `<svg ${ns}><image href="/relative/path.svg"/></svg>`,
      `<svg ${ns}><use href="assets/local.svg"/></svg>`,
      `<svg ${ns}><image href="#safe"><set attributeName="href" to="https://evil.example/pixel"/></image></svg>`,
      `<svg ${ns}><image href="#safe"><animate attributeName="href" values="#safe;https://evil.example/pixel"/></image></svg>`,
      `<svg ${ns}><filter><feImage href="https://evil.example/pixel"/></filter></svg>`,
      `<svg ${ns}><pattern href="https://evil.example/pattern.svg"/></svg>`,
      `<svg ${ns}><rect style="filter:url(https://evil.example/filter.svg#f)"/></svg>`,
      `<svg ${ns}><rect fill="url(https://evil.example/fill.svg#g)"/></svg>`,
      `<svg ${ns} xml:base="https://evil.example/remote.svg"><image href="#pixel"/></svg>`,
      `<svg ${ns}><style>@import url(https://evil.example/theme.css);</style></svg>`,
      `<svg ${ns}><style>@import "https://evil.example/theme.css";</style></svg>`,
      `<svg ${ns}><style>.x{fill:url(https://evil.example/fill.svg#g)}</style></svg>`,
      // Object/array <style> shapes from the XML parser (attrs + multiple siblings).
      `<svg ${ns}><style type="text/css">@import "https://evil.example/theme.css";</style></svg>`,
      `<svg ${ns}><style id="safe">@keyframes ok{to{opacity:1}}</style><style>@import "https://evil.example/theme.css";</style></svg>`,
      // CSS-escaped url() identifiers and foreign-namespace src loaders.
      `<svg ${ns}><rect style="filter:u\\72l(https://evil.example/filter.svg#f)"/></svg>`,
      `<svg ${ns}><style>.x{fill:u\\72l(https://evil.example/fill.svg#g)}</style></svg>`,
      `<svg ${ns} xmlns:h="http://www.w3.org/1999/xhtml"><h:img src="https://evil.example/pixel"/></svg>`,
      `<svg ${ns}><image src="https://evil.example/pixel"/></svg>`,
      `<!DOCTYPE svg [<!ENTITY payload '<script>alert(1)</script>'>]><svg ${ns}>&payload;</svg>`,
      // SMIL animateColor can rewrite fill/stroke to external url(...) after scan.
      `<svg ${ns}><rect fill="#fff"><animateColor attributeName="fill" to="url(https://evil.example/fill.svg#g)"/></rect></svg>`,
      // CSS comments are whitespace: @import/**/"..." must still be rejected.
      `<svg ${ns}><style>@import/**/"https://evil.example/theme.css";</style></svg>`,
      // Foreign media poster/src loaders.
      `<svg ${ns} xmlns:h="http://www.w3.org/1999/xhtml"><h:video poster="https://evil.example/pixel"/></svg>`,
      `<svg ${ns} xmlns:h="http://www.w3.org/1999/xhtml"><h:video src="https://evil.example/clip.mp4"/></svg>`,
      // Comment-shaped text inside a PI must not erase a following DOCTYPE.
      `<?x <!-- ?><!DOCTYPE svg [<!ENTITY payload '<script>alert(1)</script>'>]><!-- --><svg ${ns}>&payload;</svg>`,
      // image()/image-set() string URLs fetch without url(...).
      `<svg ${ns}><rect style="background:image('https://evil.example/a.png')"/></svg>`,
      `<svg ${ns}><rect style="background:image-set('https://evil.example/a.png' 1x)"/></svg>`,
      `<svg ${ns}><style>.x{background:image-set("https://evil.example/a.png" 1x)}</style></svg>`,
      `<svg ${ns}><style>.x{background:-webkit-image-set("https://evil.example/a.png" 1x)}</style></svg>`,
      `<svg ${ns}><rect style="background:image-set('https://evil.example/a.png' type('image/png'))"/></svg>`,
      `<svg ${ns}><style>.x{background:image("https://evil.example/a.png")}</style></svg>`,
      // CSS string line continuations (backslash + newline) must decode before URL scan.
      `<svg ${ns}><style>.x{fill:url("https:\\
//evil.example/x")}</style></svg>`,
      `<svg ${ns}><rect style="filter:url('https:\\
//evil.example/filter.svg#f')"/></svg>`,
      `<svg ${ns}><style>@import "https:\\
//evil.example/theme.css";</style></svg>`,
      // Anchor ping= hyperlink audit targets are outbound URLs.
      `<svg ${ns}><a href="#safe" ping="https://evil.example/a"/></svg>`,
      `<svg ${ns}><a href="#safe" ping="#ok https://evil.example/b"/></svg>`,
      // CSS allows @import"..." with no whitespace after the at-keyword.
      `<svg ${ns}><style>@import"https://evil.example/theme.css";</style></svg>`,
      `<svg ${ns}><style>@import'https://evil.example/theme.css';</style></svg>`,
      // Quoted /* */ markers must not erase intervening url() declarations.
      `<svg ${ns}><rect style='--a:"/*";filter:url(https://evil.example/f.svg);--b:"*/"'/></svg>`,
      `<svg ${ns}><style>.x{--a:"/*";fill:url(https://evil.example/fill.svg#g);--b:"*/"}</style></svg>`,
      // xml-stylesheet + embedded XSLT can synthesize script/external loads.
      `<?xml-stylesheet type="text/xsl" href="#x"?><svg ${ns}><xsl:stylesheet id="x" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0"><xsl:template match="/"><xsl:element name="script"/></xsl:template></xsl:stylesheet></svg>`,
      `<svg ${ns} xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:stylesheet version="1.0"><xsl:template match="/"/></xsl:stylesheet></svg>`,
      // Hex-escaped ASCII whitespace inside unquoted url() still forms an HTTPS URL.
      `<svg ${ns}><rect style="fill:url(ht\\9 tps://evil.example/x)"/></svg>`,
      `<svg ${ns}><style>.x{filter:url(ht\\9 tps://evil.example/filter.svg#f)}</style></svg>`,
      // Escaped /* */ must not become comments that erase intervening url().
      `<svg ${ns}><rect style="--a:\\2f\\2a;filter:url(https://evil.example/f.svg);--b:\\2a\\2f"/></svg>`,
      `<svg ${ns}><style>.x{--a:\\2f\\2a;fill:url(https://evil.example/fill.svg#g);--b:\\2a\\2f}</style></svg>`,
      // image-set(var(--*)) resolves custom properties to external string sources.
      `<svg ${ns}><rect style="--remote:'https://evil.example/a.png';mask-image:image-set(var(--remote) 1x)"/></svg>`,
      `<svg ${ns}><style>.x{--r:"https://evil.example/a.png";background:image(var(--r))}</style></svg>`,
      // Unterminated image-set/url still fetch under CSS EOF error recovery.
      `<svg ${ns}><rect style="mask-image:image-set('https://evil.example/a.png' 1x"/></svg>`,
      `<svg ${ns}><rect style="filter:url(https://evil.example/f.svg"/></svg>`,
      // Foreign form action/formaction submit to external endpoints.
      `<svg ${ns} xmlns:h="http://www.w3.org/1999/xhtml"><h:form action="https://evil.example/collect"><h:button>Submit</h:button></h:form></svg>`,
      `<svg ${ns} xmlns:h="http://www.w3.org/1999/xhtml"><h:form action="#ok"><h:button formaction="https://evil.example/collect">Go</h:button></h:form></svg>`,
      // XML Events listener can load an external handler document.
      `<svg ${ns} xmlns:ev="http://www.w3.org/2001/xml-events"><ev:listener event="load" handler="https://evil.example/events.svg#h"/></svg>`,
      // Foreign meta refresh navigates without href/src.
      `<svg ${ns} xmlns:h="http://www.w3.org/1999/xhtml"><h:meta http-equiv="refresh" content="0;url=https://evil.example/"/></svg>`,
      // Hex-escaped quote (\\22) must not open a CSS string and hide url().
      `<svg ${ns}><rect style='--x:\\22;filter:url(https://evil.example/f.svg)'/></svg>`,
      `<svg ${ns}><style>.x{--x:\\22;fill:url(https://evil.example/fill.svg#g)}</style></svg>`,
      // Legacy HTML background= on foreign containers fetches images.
      `<svg ${ns} xmlns:h="http://www.w3.org/1999/xhtml"><h:body background="https://evil.example/pixel"><h:table/></h:body></svg>`,
      // Escaped `/` before `*` is not a CSS comment opener; url() must stay visible.
      `<svg ${ns}><rect style="--a:\\/*;filter:url(https://evil.example/f.svg);--b:*/"/></svg>`,
      `<svg ${ns}><style>.x{--a:\\/*;fill:url(https://evil.example/fill.svg#g);--b:*/}</style></svg>`,
      // CSS Values src() fetches fonts/resources without url(...).
      `<svg ${ns}><style>@font-face{font-family:x;src:src("https://evil.example/f.woff")}text{font-family:x}</style></svg>`,
      `<svg ${ns}><rect style="background:src('https://evil.example/a.png')"/></svg>`,
      `<svg ${ns}><style>.x{mask-image:src(https://evil.example/m.png)}</style></svg>`,
    ];
    for (const payload of cases) {
      expect(() => compileProfile(validConfig, renderer(payload))).toThrow(
        /unsafe/,
      );
    }
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns}><defs><filter id="f"/><linearGradient id="g"/></defs><style>@keyframes ok{to{opacity:1}}</style><use href="#icon"/><a href="#section"/><rect fill="url(#g)" filter="url(#f)" style="mask:url(#m)"/></svg>`,
        ),
      ),
    ).not.toThrow();
    // Fragment-only image-set sources (and type() MIME strings) stay allowed.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns}><rect style="background:image-set('#icon' 1x type('image/png'))"/></svg>`,
        ),
      ),
    ).not.toThrow();
    // Fragment-only ping targets stay allowed (no outbound hyperlink audit).
    expect(() =>
      compileProfile(
        validConfig,
        renderer(`<svg ${ns}><a href="#safe" ping="#audit"/></svg>`),
      ),
    ).not.toThrow();
    // Fragment-only form action stays allowed (no outbound submit).
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns} xmlns:h="http://www.w3.org/1999/xhtml"><h:form action="#local"><h:button>Go</h:button></h:form></svg>`,
        ),
      ),
    ).not.toThrow();
    // DOCTYPE-like text inside comments must not fail compilation.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns}><!-- generated without <!DOCTYPE html> --><rect width="1" height="1"/></svg>`,
        ),
      ),
    ).not.toThrow();
    // DOCTYPE/ENTITY literals inside CDATA are display text, not declarations.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns}><text><![CDATA[<!DOCTYPE html><!ENTITY example>]]></text></svg>`,
        ),
      ),
    ).not.toThrow();
    // xmlns:* namespace URIs are identifiers, not href/src fetch targets.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns} xmlns:href="urn:vendor"><rect width="1" height="1"/></svg>`,
        ),
      ),
    ).not.toThrow();
    // Out-of-range CSS escapes must not throw; harmless values stay accepted.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(`<svg ${ns}><rect style="fill:\\FFFFFF"/></svg>`),
      ),
    ).not.toThrow();
    // Unqualified base is not xml:base and must not fail compilation.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns}><metadata base="main"/><rect width="1" height="1"/></svg>`,
        ),
      ),
    ).not.toThrow();
    // URL-shaped text inside CSS strings is not a live fetch target.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns}><rect style="content:'url(https://docs.example)'"/></svg>`,
        ),
      ),
    ).not.toThrow();
    // image()/image-set() text inside CSS strings is not a live fetch target.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns}><style>.x::before{content:"image('https://docs.example/example.png')"}</style></svg>`,
        ),
      ),
    ).not.toThrow();
    // @import text inside CSS strings is not a live stylesheet import.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns}><style>.x::before{content:"@import'https://docs.example/theme.css'"}</style></svg>`,
        ),
      ),
    ).not.toThrow();
    // DOCTYPE-like text inside PI data is inert, not a real declaration.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<?note generated without <!DOCTYPE html>?><svg ${ns}><rect width="1" height="1"/></svg>`,
        ),
      ),
    ).not.toThrow();
    // Fragment-only src() stays allowed (no outbound font/resource fetch).
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns}><style>@font-face{font-family:x;src:src("#local-font")}text{font-family:x}</style></svg>`,
        ),
      ),
    ).not.toThrow();
    // src() text inside CSS strings is not a live fetch target.
    expect(() =>
      compileProfile(
        validConfig,
        renderer(
          `<svg ${ns}><style>.x::before{content:"src('https://docs.example/f.woff')"}</style></svg>`,
        ),
      ),
    ).not.toThrow();
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
    expect(publicApi.MonolithRenderer).toBeTypeOf("function");
    expect(publicApi.InterlaceRenderer).toBeTypeOf("function");
    expect(publicApi.CipherPrintRenderer).toBeTypeOf("function");
    expect(publicApi.FieldSpecimenRenderer).toBeTypeOf("function");
    expect(publicApi.PatchbayRenderer).toBeTypeOf("function");
    expect(publicApi.CartographRenderer).toBeTypeOf("function");
    expect(publicApi.FoundryRenderer).toBeTypeOf("function");
    expect(publicApi.THEME_PRESETS).toEqual(THEME_PRESETS);
  });
});
