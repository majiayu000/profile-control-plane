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
]);

const HREF_SCAN_ELEMENTS = new Set(["image", "use", "a"]);

function elementLocalName(key: string): string {
  const normalized = key.toLowerCase();
  const separator = normalized.lastIndexOf(":");
  return separator === -1 ? normalized : normalized.slice(separator + 1);
}

function isHrefAttribute(attrName: string): boolean {
  return attrName === "href" || attrName.endsWith(":href");
}

/** Reject data/javascript schemes and non-fragment external URLs. */
function isUnsafeHref(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) return false;
  if (/^\s*(data|javascript):/i.test(trimmed)) return true;
  if (trimmed.startsWith("//")) return true;
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
}

function containsActiveContent(
  value: unknown,
  parentLocalName?: string,
): boolean {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((item) => containsActiveContent(item, parentLocalName));
  }
  return Object.entries(value as Record<string, unknown>).some(
    ([key, child]) => {
      const normalized = key.toLowerCase();
      if (normalized.startsWith("@_")) {
        const attrName = normalized.slice(2);
        if (attrName.startsWith("on")) return true;
        if (typeof child === "string" && /^\s*javascript:/i.test(child))
          return true;
        if (
          parentLocalName &&
          HREF_SCAN_ELEMENTS.has(parentLocalName) &&
          isHrefAttribute(attrName) &&
          typeof child === "string" &&
          isUnsafeHref(child)
        )
          return true;
        return false;
      }
      const localName = elementLocalName(normalized);
      if (BLOCKED_ELEMENTS.has(localName)) return true;
      return containsActiveContent(child, localName);
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
