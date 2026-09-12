import { XMLParser, XMLValidator } from "fast-xml-parser";
import { ProfileError } from "../core/errors.js";
import type {
  CompiledFile,
  CompiledProfile,
  ProfileConfig,
  ThemeRenderer,
} from "../core/types.js";
import { renderReadme } from "../render/readme.js";
import { getThemeDefinition } from "../themes/registry.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  processEntities: false,
});

function validateSvg(file: CompiledFile): void {
  const validation = XMLValidator.validate(file.content);
  if (validation !== true) {
    throw new ProfileError(
      "OUTPUT_INVALID",
      `generated SVG is invalid: ${file.path}`,
      [validation.err.msg],
    );
  }
  const parsed = parser.parse(file.content) as Record<string, unknown>;
  if (!("svg" in parsed))
    throw new ProfileError(
      "OUTPUT_INVALID",
      `generated asset is not an SVG: ${file.path}`,
    );
  if (containsActiveContent(parsed)) {
    throw new ProfileError(
      "OUTPUT_INVALID",
      `generated SVG contains unsafe active content: ${file.path}`,
    );
  }
}

const BLOCKED_ELEMENTS = new Set([
  "script",
  "handler",
  "foreignobject",
  "iframe",
  "embed",
  "object",
  // SMIL can rewrite href after compile-time checks; block mutation elements.
  "set",
  "animate",
  "animatetransform",
  "animatemotion",
]);

/** Presentation attributes that commonly embed CSS url(...) references. */
const URL_PRESENTATION_ATTRS = new Set([
  "fill",
  "stroke",
  "filter",
  "clip-path",
  "mask",
  "marker",
  "marker-start",
  "marker-mid",
  "marker-end",
  "cursor",
]);

function elementLocalName(key: string): string {
  const normalized = key.toLowerCase();
  const separator = normalized.lastIndexOf(":");
  return separator === -1 ? normalized : normalized.slice(separator + 1);
}

function isHrefAttribute(attrName: string): boolean {
  return attrName === "href" || attrName.endsWith(":href");
}

function isXmlBaseAttribute(attrName: string): boolean {
  return attrName === "xml:base" || attrName === "base";
}

/** Allow fragment refs only; reject schemes, protocol-relative, and path/relative URLs. */
function isUnsafeHref(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return !trimmed.startsWith("#");
}

/** Extract url(...) targets from CSS/presentation attribute values. */
function extractCssUrls(value: string): string[] {
  const urls: string[] = [];
  const pattern = /url\s*\(\s*(?:(["'])(.*?)\1|([^)\s]+))\s*\)/gi;
  for (const match of value.matchAll(pattern)) {
    const target = (match[2] ?? match[3] ?? "").trim();
    if (target.length > 0) urls.push(target);
  }
  return urls;
}

function hasUnsafeCssUrls(value: string): boolean {
  return extractCssUrls(value).some(isUnsafeHref);
}

function containsActiveContent(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((item) => containsActiveContent(item));
  }
  return Object.entries(value as Record<string, unknown>).some(
    ([key, child]) => {
      const normalized = key.toLowerCase();
      if (normalized.startsWith("@_")) {
        const attrName = normalized.slice(2);
        if (attrName.startsWith("on")) return true;
        if (typeof child !== "string") return false;
        if (/^\s*javascript:/i.test(child)) return true;
        // Any non-empty xml:base rebases fragment hrefs against an attacker-chosen URI.
        if (isXmlBaseAttribute(attrName) && child.trim().length > 0)
          return true;
        // Validate href on every element (feImage, pattern, textPath, etc.).
        if (isHrefAttribute(attrName) && isUnsafeHref(child)) return true;
        if (attrName === "style" && hasUnsafeCssUrls(child)) return true;
        if (URL_PRESENTATION_ATTRS.has(attrName) && hasUnsafeCssUrls(child))
          return true;
        return false;
      }
      const localName = elementLocalName(normalized);
      if (BLOCKED_ELEMENTS.has(localName)) return true;
      return containsActiveContent(child);
    },
  );
}

export function compileProfile(
  config: ProfileConfig,
  renderer?: ThemeRenderer,
): CompiledProfile {
  const theme = getThemeDefinition(config.theme.preset);
  const selectedRenderer = renderer ?? theme.renderer;
  const files: CompiledFile[] = [
    {
      path: "assets/hero-dark.svg",
      content: selectedRenderer.renderHero(config, "dark"),
    },
    {
      path: "assets/hero-light.svg",
      content: selectedRenderer.renderHero(config, "light"),
    },
    {
      path: "assets/closed-loop-dark.svg",
      content: selectedRenderer.renderLoop(config, "dark"),
    },
    {
      path: "assets/closed-loop-light.svg",
      content: selectedRenderer.renderLoop(config, "light"),
    },
    { path: "README.md", content: renderReadme(config, theme.copy) },
  ];
  for (const file of files.filter((candidate) =>
    candidate.path.endsWith(".svg"),
  ))
    validateSvg(file);
  return { files };
}
