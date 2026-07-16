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

function containsActiveContent(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(
    ([key, child]) => {
      const normalized = key.toLowerCase();
      if (normalized === "script" || normalized.startsWith("@_on")) return true;
      if (
        normalized.startsWith("@_") &&
        typeof child === "string" &&
        /^\s*javascript:/i.test(child)
      )
        return true;
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
