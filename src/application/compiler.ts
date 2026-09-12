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

/**
 * Strip real XML comments without treating comment-shaped text inside
 * processing instructions or CDATA as comment delimiters.
 */
function stripXmlComments(content: string): string {
  let result = "";
  let i = 0;
  while (i < content.length) {
    if (content.startsWith("<!--", i)) {
      const end = content.indexOf("-->", i + 4);
      if (end === -1) break;
      i = end + 3;
      continue;
    }
    if (content.startsWith("<![CDATA[", i)) {
      const end = content.indexOf("]]>", i + 9);
      if (end === -1) {
        result += content.slice(i);
        break;
      }
      result += content.slice(i, end + 3);
      i = end + 3;
      continue;
    }
    if (content.startsWith("<?", i)) {
      const end = content.indexOf("?>", i + 2);
      if (end === -1) {
        result += content.slice(i);
        break;
      }
      result += content.slice(i, end + 2);
      i = end + 2;
      continue;
    }
    result += content[i];
    i += 1;
  }
  return result;
}

function hasDoctypeOrEntityDeclarations(content: string): boolean {
  // processEntities:false leaves &entity; unexpanded, so consumers that expand
  // DTD entities can reintroduce blocked markup. Reject declarations outright.
  // Ignore real comment text so provenance notes mentioning DOCTYPE stay allowed.
  const withoutComments = stripXmlComments(content);
  return (
    /<!DOCTYPE\b/i.test(withoutComments) || /<!ENTITY\b/i.test(withoutComments)
  );
}

/** xml-stylesheet PIs can apply embedded XSLT that synthesizes blocked markup. */
function hasXmlStylesheetPi(content: string): boolean {
  const withoutComments = stripXmlComments(content);
  return /<\?xml-stylesheet\b/i.test(withoutComments);
}

function isXsltElementKey(key: string): boolean {
  // xsl:stylesheet, xsl:element, … — prefix check avoids blocking SVG <text>.
  return /(^|:)xsl:/.test(key.toLowerCase());
}

function validateSvg(file: CompiledFile): void {
  if (
    hasDoctypeOrEntityDeclarations(file.content) ||
    hasXmlStylesheetPi(file.content)
  ) {
    throw new ProfileError(
      "OUTPUT_INVALID",
      `generated SVG contains unsafe active content: ${file.path}`,
    );
  }
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
  // Foreign XHTML loaders can fetch without href/foreignObject.
  "img",
  "video",
  "audio",
  "source",
  "track",
  // SMIL can rewrite href/fill/stroke after compile-time checks; block mutation.
  "set",
  "animate",
  "animatecolor",
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

function isSrcAttribute(attrName: string): boolean {
  return attrName === "src" || attrName.endsWith(":src");
}

function isPosterAttribute(attrName: string): boolean {
  return attrName === "poster" || attrName.endsWith(":poster");
}

function isPingAttribute(attrName: string): boolean {
  return attrName === "ping" || attrName.endsWith(":ping");
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

/** Space-separated hyperlink-audit targets (HTML ping) must also be fragment-only. */
function hasUnsafePingUrls(value: string): boolean {
  return value
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .some(isUnsafeHref);
}

/**
 * Decode CSS escapes (e.g. u\\72l → url) and remove string line continuations
 * (backslash + newline) before matching URL functions.
 */
function decodeCssEscapes(value: string): string {
  // CSS: \ + line terminator is a line continuation (removed), not a character escape.
  // Handle it first — JS `.` does not match newlines, so `\\(.)` would miss these.
  return value
    .replace(/\\(?:\r\n|[\n\r\f])/g, "")
    .replace(
      /\\([0-9a-fA-F]{1,6})(?:\r\n|[ \t\r\n\f])?|\\(.)/g,
      (_match, hex: string | undefined, ch: string | undefined) => {
        if (hex !== undefined) {
          const code = Number.parseInt(hex, 16);
          // CSS replaces null, surrogates, and out-of-range code points with U+FFFD.
          if (
            Number.isNaN(code) ||
            code === 0 ||
            code > 0x10ffff ||
            (code >= 0xd800 && code <= 0xdfff)
          ) {
            return "\uFFFD";
          }
          return String.fromCodePoint(code);
        }
        return ch ?? "";
      },
    );
}

/**
 * Treat CSS comments as inter-token whitespace before import/url scans.
 * Quoted strings keep literal comment delimiters so markers inside values
 * cannot erase intervening url()/filter declarations.
 */
function stripCssComments(value: string): string {
  let result = "";
  let i = 0;
  let inQuote: '"' | "'" | null = null;
  let escaped = false;
  while (i < value.length) {
    const ch = value[i]!;
    if (inQuote) {
      result += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === inQuote) {
        inQuote = null;
      }
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      result += ch;
      i += 1;
      continue;
    }
    if (ch === "/" && value[i + 1] === "*") {
      const end = value.indexOf("*/", i + 2);
      if (end === -1) {
        result += " ";
        break;
      }
      result += " ";
      i = end + 2;
      continue;
    }
    result += ch;
    i += 1;
  }
  return result;
}

/**
 * Read the body of a CSS function given the index of its opening '('.
 * Respects quoted strings and nested parentheses.
 */
function readCssFunctionBody(css: string, openParenIdx: number): string | null {
  let depth = 0;
  let inQuote: '"' | "'" | null = null;
  let escaped = false;
  for (let i = openParenIdx; i < css.length; i += 1) {
    const ch = css[i]!;
    if (inQuote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      continue;
    }
    if (ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) return css.slice(openParenIdx + 1, i);
    }
  }
  return null;
}

/**
 * Pull image-source <string> tokens from image()/image-set() bodies.
 * MIME strings inside type("...") are ignored — they are not fetch targets.
 */
function extractCssImageFunctionStrings(css: string): string[] {
  const targets: string[] = [];
  // image(, image-set(, -webkit-image-set( — not mid-identifier.
  const callPattern = /(?<![a-zA-Z0-9_-])(?:-webkit-)?image(?:-set)?\s*\(/gi;
  let match: RegExpExecArray | null;
  while ((match = callPattern.exec(css)) !== null) {
    const openIdx = match.index + match[0].length - 1;
    const body = readCssFunctionBody(css, openIdx);
    if (body === null) continue;
    // Skip past this call so nested image() is still found by later matches
    // when scanned from the outer CSS, but avoid re-matching the same '('.
    callPattern.lastIndex = openIdx + 1 + body.length + 1;

    // Drop type("mime/type") args so MIME strings are not treated as URLs.
    const withoutTypeArgs = body.replace(
      /type\s*\(\s*(["'])(?:\\.|(?!\1).)*\1\s*\)/gi,
      " ",
    );
    const stringPattern = /(["'])((?:\\.|(?!\1).)*)\1/g;
    for (const stringMatch of withoutTypeArgs.matchAll(stringPattern)) {
      const target = (stringMatch[2] ?? "").trim();
      if (target.length > 0) targets.push(target);
    }
  }
  return targets;
}

/** Extract url(...) and image()/image-set() string targets from CSS values. */
function extractCssUrls(value: string): string[] {
  const urls: string[] = [];
  const decoded = stripCssComments(decodeCssEscapes(value));
  const pattern = /url\s*\(\s*(?:(["'])(.*?)\1|([^)\s]+))\s*\)/gi;
  for (const match of decoded.matchAll(pattern)) {
    const target = (match[2] ?? match[3] ?? "").trim();
    if (target.length > 0) urls.push(target);
  }
  for (const target of extractCssImageFunctionStrings(decoded)) {
    urls.push(target);
  }
  return urls;
}

function hasUnsafeCssUrls(value: string): boolean {
  return extractCssUrls(value).some(isUnsafeHref);
}

/** Scan <style> text for url(...) and bare @import targets (not just style attrs). */
function hasUnsafeStyleSheet(value: string): boolean {
  if (hasUnsafeCssUrls(value)) return true;
  // @import "..." / @import"... (no space) / bare — url(...) covered above.
  // (?![\w-]) avoids matching longer at-keywords like @important.
  // Comments are whitespace, so @import/**/"https://..." must still match.
  const decoded = stripCssComments(decodeCssEscapes(value));
  const bareImport =
    /@import(?![\w-])\s*(?!url\b)(?:(["'])(.*?)\1|([^\s;]+))/gi;
  for (const match of decoded.matchAll(bareImport)) {
    const target = (match[2] ?? match[3] ?? "").trim();
    if (target.length > 0 && isUnsafeHref(target)) return true;
  }
  return false;
}

function styleElementHasUnsafeContent(value: unknown): boolean {
  if (typeof value === "string") return hasUnsafeStyleSheet(value);
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((item) => styleElementHasUnsafeContent(item));
  }
  return Object.entries(value as Record<string, unknown>).some(
    ([key, child]) => {
      // Attribute checks for style elements still run via containsActiveContent.
      if (key.startsWith("@_")) return false;
      return styleElementHasUnsafeContent(child);
    },
  );
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
        // Validate href/src/poster/ping on every element (feImage, XHTML media, anchors).
        if (isHrefAttribute(attrName) && isUnsafeHref(child)) return true;
        if (isSrcAttribute(attrName) && isUnsafeHref(child)) return true;
        if (isPosterAttribute(attrName) && isUnsafeHref(child)) return true;
        if (isPingAttribute(attrName) && hasUnsafePingUrls(child)) return true;
        if (attrName === "style" && hasUnsafeCssUrls(child)) return true;
        if (URL_PRESENTATION_ATTRS.has(attrName) && hasUnsafeCssUrls(child))
          return true;
        return false;
      }
      if (isXsltElementKey(normalized)) return true;
      const localName = elementLocalName(normalized);
      if (BLOCKED_ELEMENTS.has(localName)) return true;
      // <style> bodies are text/#text, not attributes — scan stylesheet content.
      if (localName === "style" && styleElementHasUnsafeContent(child))
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
