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
      // Skip CDATA bodies: literal `<!DOCTYPE` / `<?xml-stylesheet` text is
      // inert markup, not a real declaration or processing instruction.
      const end = content.indexOf("]]>", i + 9);
      if (end === -1) break;
      i = end + 3;
      continue;
    }
    if (content.startsWith("<?", i)) {
      const end = content.indexOf("?>", i + 2);
      if (end === -1) {
        result += content.slice(i);
        break;
      }
      // Keep only the PI target (for xml-stylesheet detection). PI data can
      // contain inert `<!DOCTYPE` text that must not trip declaration scans.
      const piBody = content.slice(i + 2, end);
      const target = piBody.match(/^\s*([^\s?]+)/)?.[1] ?? "";
      result += `<?${target}?>`;
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
  // XML Events <listener handler="..."> can load external handler documents.
  "listener",
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
  // Foreign meta refresh can navigate without href/src.
  "meta",
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
  // CSS Motion Path can fetch an external SVG via url(...).
  "offset-path",
]);

function elementLocalName(key: string): string {
  const normalized = key.toLowerCase();
  const separator = normalized.lastIndexOf(":");
  return separator === -1 ? normalized : normalized.slice(separator + 1);
}

/** xmlns / xmlns:* declare namespace URIs; they are not fetch targets. */
function isXmlnsAttribute(attrName: string): boolean {
  return attrName === "xmlns" || attrName.startsWith("xmlns:");
}

function isHrefAttribute(attrName: string): boolean {
  if (isXmlnsAttribute(attrName)) return false;
  return attrName === "href" || attrName.endsWith(":href");
}

function isSrcAttribute(attrName: string): boolean {
  if (isXmlnsAttribute(attrName)) return false;
  return attrName === "src" || attrName.endsWith(":src");
}

function isPosterAttribute(attrName: string): boolean {
  if (isXmlnsAttribute(attrName)) return false;
  return attrName === "poster" || attrName.endsWith(":poster");
}

function isPingAttribute(attrName: string): boolean {
  if (isXmlnsAttribute(attrName)) return false;
  return attrName === "ping" || attrName.endsWith(":ping");
}

/** HTML form submission targets (action / formaction). */
function isFormSubmissionAttribute(attrName: string): boolean {
  if (isXmlnsAttribute(attrName)) return false;
  return (
    attrName === "action" ||
    attrName.endsWith(":action") ||
    attrName === "formaction" ||
    attrName.endsWith(":formaction")
  );
}

/** XML Events handler= URI on <listener> (and similar). */
function isHandlerUriAttribute(attrName: string): boolean {
  if (isXmlnsAttribute(attrName)) return false;
  return attrName === "handler" || attrName.endsWith(":handler");
}

/** Legacy HTML background= image URL on foreign containers (body/table/…). */
function isBackgroundAttribute(attrName: string): boolean {
  if (isXmlnsAttribute(attrName)) return false;
  return attrName === "background" || attrName.endsWith(":background");
}

/** Responsive image candidate lists (srcset / imagesrcset). */
function isSrcSetAttribute(attrName: string): boolean {
  if (isXmlnsAttribute(attrName)) return false;
  return (
    attrName === "srcset" ||
    attrName.endsWith(":srcset") ||
    attrName === "imagesrcset" ||
    attrName.endsWith(":imagesrcset")
  );
}

/**
 * Parse HTML srcset/imagesrcset candidates and reject any non-fragment URL.
 * Each comma-separated candidate begins with a URL token before descriptors.
 */
function hasUnsafeSrcSetUrls(value: string): boolean {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .some((candidate) => {
      const url = candidate.split(/\s+/)[0] ?? "";
      return url.length > 0 && isUnsafeHref(url);
    });
}

function isXmlBaseAttribute(attrName: string): boolean {
  // Only namespace-qualified xml:base rebases URIs; unqualified `base` does not.
  return attrName === "xml:base";
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
 * Quotes produced by CSS escapes (e.g. \\22 → ") must not become string
 * delimiters during scan walks — that would skip following url()/filter text.
 */
const CSS_ESCAPED_QUOTE_PLACEHOLDER = "\uFFFC";
/**
 * Parentheses produced by CSS escapes (e.g. \\28 → "(") must not become
 * structural nesting during readCssFunctionBody — that would absorb a following
 * filter:url(...) into a fragment-looking target such as url(#safe\28 ).
 */
const CSS_ESCAPED_OPEN_PAREN_PLACEHOLDER = "\uE000";
const CSS_ESCAPED_CLOSE_PAREN_PLACEHOLDER = "\uE001";

/** CSS bad-string: unescaped newline/CR/FF ends the string token. */
function isCssBadStringTerminator(ch: string): boolean {
  return ch === "\n" || ch === "\r" || ch === "\f";
}

function placeholderForEscapedCssChar(decoded: string): string | null {
  if (decoded === '"' || decoded === "'") return CSS_ESCAPED_QUOTE_PLACEHOLDER;
  if (decoded === "(") return CSS_ESCAPED_OPEN_PAREN_PLACEHOLDER;
  if (decoded === ")") return CSS_ESCAPED_CLOSE_PAREN_PLACEHOLDER;
  return null;
}

/**
 * Decode CSS escapes (e.g. u\\72l → url) and remove string line continuations
 * (backslash + newline) before matching URL functions.
 * Escaped quotes/parentheses become non-delimiter placeholders so token
 * boundaries stay stable for string-aware scanners.
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
          const decoded = String.fromCodePoint(code);
          return placeholderForEscapedCssChar(decoded) ?? decoded;
        }
        if (ch === undefined) return "";
        return placeholderForEscapedCssChar(ch) ?? ch;
      },
    );
}

/**
 * Treat CSS comments as inter-token whitespace before import/url scans.
 * Quoted strings keep literal comment delimiters so markers inside values
 * cannot erase intervening url()/filter declarations. Outside strings,
 * escaped `/` (e.g. `\/*`) is not a comment opener — CSS keeps the slash as
 * token content, so the following filter/url must remain visible to scans.
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
      } else if (ch === inQuote || isCssBadStringTerminator(ch)) {
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
    // Outside strings, honor escapes so `\/*` does not open a comment.
    if (ch === "\\") {
      result += ch;
      if (i + 1 < value.length) {
        result += value[i + 1]!;
        i += 2;
      } else {
        i += 1;
      }
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
      if (ch === inQuote || isCssBadStringTerminator(ch)) inQuote = null;
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
 * Normalize CSS before URL/import scans: strip real comments first (string-
 * aware), then decode escapes. Decoding first would turn `\2f\2a` ... `\2a\2f`
 * into synthetic comment delimiters and erase intervening url()/filter text.
 */
function normalizeCssForScan(value: string): string {
  return decodeCssEscapes(stripCssComments(value));
}

function cssContainsVarFunction(css: string): boolean {
  return /(?<![a-zA-Z0-9_-])var\s*\(/i.test(css);
}

type CssUrlScan = { urls: string[]; unsafe: boolean };

/**
 * Pull image-source <string> tokens from image()/image-set() bodies.
 * MIME strings inside type("...") are ignored — they are not fetch targets.
 * Unterminated calls and var() sources are treated as unsafe (CSS resolves
 * them / closes open functions at EOF during error recovery).
 * Matches only outside CSS string tokens so content:"image(...)" stays inert.
 */
function extractCssImageFunctionStrings(css: string): CssUrlScan {
  const targets: string[] = [];
  let i = 0;
  let inQuote: '"' | "'" | null = null;
  let escaped = false;
  while (i < css.length) {
    const ch = css[i]!;
    if (inQuote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === inQuote || isCssBadStringTerminator(ch)) {
        inQuote = null;
      }
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      i += 1;
      continue;
    }
    const prev = i === 0 ? "" : css[i - 1]!;
    if (
      (prev.length === 0 || !/[a-zA-Z0-9_-]/.test(prev)) &&
      /^(?:-webkit-)?image(?:-set)?\s*\(/i.test(css.slice(i))
    ) {
      const call = css.slice(i).match(/^(?:-webkit-)?image(?:-set)?\s*\(/i)!;
      const openIdx = i + call[0].length - 1;
      const body = readCssFunctionBody(css, openIdx);
      if (body === null) return { urls: targets, unsafe: true };

      // Custom properties resolve before image-set validates sources; reject var().
      if (cssContainsVarFunction(body)) return { urls: targets, unsafe: true };

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
      i = openIdx + 1 + body.length + 1;
      continue;
    }
    i += 1;
  }
  return { urls: targets, unsafe: false };
}

/**
 * Strip ASCII controls that URL parsers remove (e.g. tab from `\9` escapes)
 * so hex-escaped whitespace cannot hide external fetch targets.
 */
function normalizeCssUrlTarget(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replaceAll(CSS_ESCAPED_QUOTE_PLACEHOLDER, "")
    .replaceAll(CSS_ESCAPED_OPEN_PAREN_PLACEHOLDER, "(")
    .replaceAll(CSS_ESCAPED_CLOSE_PAREN_PLACEHOLDER, ")")
    .trim();
}

/**
 * Extract url(...)/src(...) targets outside CSS string tokens. Quoted text
 * such as content:"url(https://docs.example)" is not a live fetch.
 * Unterminated url(/src( calls are unsafe — CSS closes open functions at EOF.
 * `src()` is the CSS Values URL notation used by @font-face and similar.
 */
function extractCssUrlFunctionTargets(css: string): CssUrlScan {
  const urls: string[] = [];
  let i = 0;
  let inQuote: '"' | "'" | null = null;
  let escaped = false;
  while (i < css.length) {
    const ch = css[i]!;
    if (inQuote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === inQuote || isCssBadStringTerminator(ch)) {
        inQuote = null;
      }
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      i += 1;
      continue;
    }
    const prev = i === 0 ? "" : css[i - 1]!;
    if (
      (prev.length === 0 || !/[a-zA-Z0-9_-]/.test(prev)) &&
      /^(?:url|src)\s*\(/i.test(css.slice(i))
    ) {
      const call = css.slice(i).match(/^(?:url|src)\s*\(/i)!;
      const openIdx = i + call[0].length - 1;
      const body = readCssFunctionBody(css, openIdx);
      if (body === null) return { urls, unsafe: true };
      const trimmed = body.trim();
      let target = "";
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        target = trimmed.slice(1, -1);
      } else {
        target = trimmed;
      }
      const normalized = normalizeCssUrlTarget(target);
      if (normalized.length > 0) urls.push(normalized);
      i = openIdx + 1 + body.length + 1;
      continue;
    }
    i += 1;
  }
  return { urls, unsafe: false };
}

/** Extract url()/src() and image()/image-set() string targets from CSS values. */
function extractCssUrls(value: string): CssUrlScan {
  const decoded = normalizeCssForScan(value);
  const fromUrl = extractCssUrlFunctionTargets(decoded);
  if (fromUrl.unsafe) return fromUrl;
  const fromImage = extractCssImageFunctionStrings(decoded);
  if (fromImage.unsafe) return { urls: fromUrl.urls, unsafe: true };
  const urls = [...fromUrl.urls];
  for (const target of fromImage.urls) {
    const normalized = normalizeCssUrlTarget(target);
    if (normalized.length > 0) urls.push(normalized);
  }
  return { urls, unsafe: false };
}

function hasUnsafeCssUrls(value: string): boolean {
  const scanned = extractCssUrls(value);
  if (scanned.unsafe) return true;
  return scanned.urls.some(isUnsafeHref);
}

/** Scan <style> text for url(...) and bare @import targets (not just style attrs). */
function hasUnsafeStyleSheet(value: string): boolean {
  if (hasUnsafeCssUrls(value)) return true;
  // @import "..." / @import"... (no space) / bare — url(...) covered above.
  // (?![\w-]) avoids matching longer at-keywords like @important.
  // Comments are whitespace, so @import/**/"https://..." must still match.
  // Only match outside CSS string tokens so content:"@import'...'" stays inert.
  const decoded = normalizeCssForScan(value);
  return extractBareCssImportTargets(decoded).some(
    (target) => target.length > 0 && isUnsafeHref(target),
  );
}

/**
 * Extract bare @import targets outside CSS strings. @import url(...) is left
 * to extractCssUrlFunctionTargets.
 */
function extractBareCssImportTargets(css: string): string[] {
  const targets: string[] = [];
  let i = 0;
  let inQuote: '"' | "'" | null = null;
  let escaped = false;
  while (i < css.length) {
    const ch = css[i]!;
    if (inQuote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === inQuote || isCssBadStringTerminator(ch)) {
        inQuote = null;
      }
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      i += 1;
      continue;
    }
    const prev = i === 0 ? "" : css[i - 1]!;
    if (
      (prev.length === 0 || !/[a-zA-Z0-9_-]/.test(prev)) &&
      /^@import(?![\w-])/i.test(css.slice(i))
    ) {
      const head = css.slice(i).match(/^@import(?![\w-])\s*/i)!;
      let j = i + head[0].length;
      if (/^url\b/i.test(css.slice(j))) {
        // url(...) import — handled by extractCssUrlFunctionTargets.
        i = j;
        continue;
      }
      const rest = css.slice(j);
      const quoted = rest.match(/^(["'])(.*?)\1/);
      if (quoted) {
        targets.push(normalizeCssUrlTarget(quoted[2] ?? ""));
        i = j + quoted[0].length;
        continue;
      }
      const bare = rest.match(/^([^\s;]+)/);
      if (bare) {
        targets.push(normalizeCssUrlTarget(bare[1] ?? ""));
        i = j + bare[0].length;
        continue;
      }
      i = j;
      continue;
    }
    i += 1;
  }
  return targets;
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
        // Validate href/src/poster/ping/action/handler on every element.
        if (isHrefAttribute(attrName) && isUnsafeHref(child)) return true;
        if (isSrcAttribute(attrName) && isUnsafeHref(child)) return true;
        if (isPosterAttribute(attrName) && isUnsafeHref(child)) return true;
        if (isPingAttribute(attrName) && hasUnsafePingUrls(child)) return true;
        if (isFormSubmissionAttribute(attrName) && isUnsafeHref(child))
          return true;
        if (isHandlerUriAttribute(attrName) && isUnsafeHref(child)) return true;
        if (isBackgroundAttribute(attrName) && isUnsafeHref(child)) return true;
        if (isSrcSetAttribute(attrName) && hasUnsafeSrcSetUrls(child))
          return true;
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
