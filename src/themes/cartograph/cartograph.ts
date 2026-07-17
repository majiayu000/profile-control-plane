import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
  Tone,
} from "../../core/types.js";
import { shorten } from "../shared.js";

interface CartoPalette {
  readonly background: string;
  readonly paper: string;
  readonly panel: string;
  readonly ink: string;
  readonly muted: string;
  readonly rule: string;
  readonly contour: string;
  readonly sienna: string;
  readonly verdigris: string;
  readonly userPrimary: string;
  readonly userSecondary: string;
}

function createCartoPalette(
  config: ProfileConfig,
  mode: ColorMode,
): CartoPalette {
  const accents = {
    userPrimary: escapeXml(config.theme.primary),
    userSecondary: escapeXml(config.theme.secondary),
  };
  return mode === "dark"
    ? {
        background: "#0F161D",
        paper: "#16222C",
        panel: "#1D2C38",
        ink: "#E7E1CE",
        muted: "#8FA0AC",
        rule: "#3A4A57",
        contour: "#46616F",
        sienna: "#D08A3E",
        verdigris: "#63A894",
        ...accents,
      }
    : {
        background: "#D2CCBA",
        paper: "#E7E1CF",
        panel: "#F0EBDA",
        ink: "#2B3134",
        muted: "#6C7264",
        rule: "#B3AA92",
        contour: "#BFAF8E",
        sienna: "#A05E22",
        verdigris: "#3E7365",
        ...accents,
      };
}

function cartoStyle(): string {
  return `<style>
    .carto-serif{font-family:Iowan Old Style,Palatino Linotype,Book Antiqua,Georgia,serif}.carto-label{font-family:Avenir Next Condensed,Arial Narrow,sans-serif}.carto-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .carto-trace{stroke-dasharray:6 10;animation:carto-trace 10s linear infinite}.carto-beacon{transform-box:fill-box;transform-origin:center;animation:carto-beacon 3.4s ease-in-out infinite}.carto-rise{animation:carto-rise .66s cubic-bezier(.2,.75,.2,1) both}
    @keyframes carto-trace{to{stroke-dashoffset:-160}}@keyframes carto-beacon{50%{opacity:.35;transform:scale(.72)}}@keyframes carto-rise{from{opacity:.15;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @media(prefers-reduced-motion:reduce){.carto-trace,.carto-beacon,.carto-rise{animation:none}}
  </style>`;
}

function cartoDefs(palette: CartoPalette): string {
  return `<defs>
    <pattern id="carto-grid" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M46 0H0V46" fill="none" stroke="${palette.rule}" stroke-opacity=".14"/></pattern>
    <g id="carto-hill" fill="none" stroke="${palette.contour}"><path d="M0-26C15-26 26-13 26 0C26 15 13 26 0 26C-15 26-26 13-26 0C-26-15-13-26 0-26Z"/><path d="M0-15C9-15 15-8 15 0C15 9 8 15 0 15C-9 15-15 8-15 0C-15-9-8-15 0-15Z"/><path d="M0-5C3-5 5-2 5 0C5 3 2 5 0 5C-3 5-5 2-5 0C-5-3-2-5 0-5Z"/></g>
    <g id="carto-trig"><path d="M0-7L6 5H-6Z" fill="none" stroke="${palette.sienna}" stroke-width="1.6"/><circle cy="-1" r="1.4" fill="${palette.sienna}"/></g>
  </defs>`;
}

function splitCartoHeadline(value: string): readonly [string, string] {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= 22) return [normalized, ""];
  const midpoint = Math.floor(normalized.length / 2);
  const spaces = [...normalized.matchAll(/ /g)]
    .map((match) => match.index)
    .filter((index): index is number => index !== undefined);
  const split =
    spaces.length > 0
      ? spaces.reduce((nearest, candidate) =>
          Math.abs(candidate - midpoint) < Math.abs(nearest - midpoint)
            ? candidate
            : nearest,
        )
      : midpoint;
  return [normalized.slice(0, split).trim(), normalized.slice(split).trim()];
}

function cartoToneInk(tone: Tone, palette: CartoPalette): string {
  return tone === "primary" ? palette.sienna : palette.verdigris;
}

function summitRoutes(config: ProfileConfig, palette: CartoPalette): string {
  const limit = 6;
  const rows = config.flagships
    .slice(0, limit)
    .map((project, index) => {
      const y = 76 + index * 44;
      const meridianY = 174 + (index - 2.5) * 9;
      const accent = cartoToneInk(project.tone, palette);
      return `<g class="carto-rise" style="animation-delay:${100 + index * 55}ms">
        <path d="M560 ${meridianY.toFixed(1)}C610 ${meridianY.toFixed(1)} 640 ${y - 6} 688 ${y - 6}" fill="none" stroke="${accent}" stroke-opacity=".72"/><path class="carto-trace" d="M560 ${meridianY.toFixed(1)}C610 ${meridianY.toFixed(1)} 640 ${y - 6} 688 ${y - 6}" fill="none" stroke="${palette.contour}" stroke-width="1.5"/>
        <g transform="translate(700 ${y - 6})"><use class="carto-beacon" style="animation-delay:${(index * 0.37).toFixed(2)}s" href="#carto-trig"/></g>
        <text x="722" y="${y - 10}" class="carto-label" font-size="12" font-weight="800" fill="${palette.ink}">${escapeXml(shorten(project.repo, 27))}</text><text x="1142" y="${y - 10}" text-anchor="end" class="carto-mono" font-size="7.5" letter-spacing="1.3" fill="${accent}">${escapeXml(shorten(project.role, 18).toUpperCase())}</text>
        <text x="722" y="${y + 7}" class="carto-label" font-size="8.7" fill="${palette.muted}">${escapeXml(shorten(project.description, 59))}</text><path d="M722 ${y + 16}H1142" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
  const remainder = config.flagships.length - limit;
  return `${rows}${remainder > 0 ? `<text x="1142" y="318" text-anchor="end" class="carto-mono" font-size="8" fill="${palette.sienna}">+${remainder} SUMMITS IN GAZETTEER</text>` : ""}`;
}

function surveyRows(config: ProfileConfig, palette: CartoPalette): string {
  const limit = 10;
  const rows = config.layers
    .slice(0, limit)
    .map((layer, index) => {
      const column = Math.floor(index / 5);
      const row = index % 5;
      const x = 309 + column * 438;
      const y = 78 + row * 47;
      const accent = cartoToneInk(layer.tone, palette);
      return `<g class="carto-rise" style="animation-delay:${index * 42}ms">
        <path d="M${x - 19} ${y + 13}C${x - 8} ${y + 13} ${x - 10} ${y - 5} ${x + 3} ${y - 5}" fill="none" stroke="${accent}"/><g transform="translate(${x + 8} ${y - 5}) scale(.8)"><use class="carto-beacon" style="animation-delay:${(index * 0.29).toFixed(2)}s" href="#carto-trig"/></g>
        <text x="${x + 25}" y="${y - 8}" class="carto-mono" font-size="7.5" letter-spacing="1.3" fill="${accent}">${String(index + 1).padStart(2, "0")} / ${escapeXml(shorten(layer.name, 16).toUpperCase())}</text><text x="${x + 191}" y="${y - 8}" class="carto-serif" font-size="11" font-style="italic" fill="${palette.ink}">${escapeXml(shorten(layer.project, 22))}</text>
        <text x="${x + 25}" y="${y + 9}" class="carto-label" font-size="8.5" fill="${palette.muted}">${escapeXml(shorten(layer.description, 52))}</text><path d="M${x + 25} ${y + 17}H${x + 399}" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
  const remainder = config.layers.length - limit;
  return `${rows}${remainder > 0 ? `<text x="1146" y="313" text-anchor="end" class="carto-mono" font-size="8" fill="${palette.sienna}">+${remainder} PLACES IN GAZETTEER</text>` : ""}`;
}

export class CartographRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createCartoPalette(config, mode);
    const [headlineOne, headlineTwo] = splitCartoHeadline(
      config.identity.headline,
    );
    const headlineSize =
      Math.max(headlineOne.length, headlineTwo.length) > 24 ? 31 : 36;
    const location = config.identity.location
      ? `<text x="50" y="304" class="carto-mono" font-size="8" letter-spacing="1.6" fill="${palette.muted}">DATUM / ${escapeXml(shorten(config.identity.location, 28).toUpperCase())}</text>`
      : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} survey map profile" data-mode="${mode}">
      ${cartoDefs(palette)}${cartoStyle()}<rect width="1200" height="360" fill="${palette.background}"/><rect x="14" y="14" width="1172" height="332" fill="${palette.paper}" stroke="${palette.rule}"/><rect x="14" y="14" width="1172" height="332" fill="url(#carto-grid)"/>
      <rect x="30" y="30" width="500" height="300" fill="${palette.panel}" fill-opacity=".58" stroke="${palette.rule}"/><use href="#carto-hill" transform="translate(430 240)" opacity=".55"/><use href="#carto-hill" transform="translate(90 290) scale(.7)" opacity=".4"/><path d="M545 30V330" stroke="${palette.rule}"/><path d="M560 30V330" stroke="${palette.contour}" stroke-dasharray="2 6" stroke-opacity=".6"/>
      <g transform="translate(486 62)"><circle r="13" fill="none" stroke="${palette.verdigris}" stroke-width="1.4"/><path d="M0-8L4 6L0 2.5L-4 6Z" fill="${palette.sienna}"/></g>
      <g class="carto-rise"><text x="50" y="49" class="carto-mono" font-size="8" letter-spacing="2.3" fill="${palette.verdigris}">CARTOGRAPH / FIELD SURVEY</text><text x="50" y="82" class="carto-label" font-size="12" font-weight="800" letter-spacing="2" fill="${palette.sienna}">${escapeXml(shorten(config.identity.name, 28).toUpperCase())}</text>
      <text x="48" y="133" class="carto-serif" font-size="${headlineSize}" font-weight="700" fill="${palette.ink}">${escapeXml(headlineOne)}</text>${headlineTwo ? `<text x="48" y="${133 + headlineSize}" class="carto-serif" font-size="${headlineSize}" font-style="italic" fill="${palette.ink}">${escapeXml(headlineTwo)}</text>` : ""}
      <path d="M50 210H132" stroke="${palette.sienna}" stroke-width="4"/><text x="50" y="238" class="carto-serif" font-size="12" font-style="italic" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 72))}</text>
      <text x="50" y="276" class="carto-mono" font-size="8" letter-spacing="1.5" fill="${palette.ink}">${String(config.flagships.length).padStart(2, "0")} SUMMITS · ${String(config.layers.length).padStart(2, "0")} CONTOUR LAYERS</text>${location}</g>
      <text x="660" y="47" class="carto-serif" font-size="16" font-style="italic" fill="${palette.ink}">Surveyed summits</text><text x="1142" y="47" text-anchor="end" class="carto-mono" font-size="8" letter-spacing="1.4" fill="${palette.muted}">SHEET / ${escapeXml(shorten(config.github.username, 22).toUpperCase())}</text>${summitRoutes(config, palette)}
      <circle cx="500" cy="315" r="3" fill="${palette.userPrimary}"/><circle cx="512" cy="315" r="3" fill="${palette.userSecondary}"/>
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createCartoPalette(config, mode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} contour survey" data-mode="${mode}">
      ${cartoDefs(palette)}${cartoStyle()}<rect width="1200" height="330" fill="${palette.background}"/><rect x="14" y="14" width="1172" height="302" fill="${palette.paper}" stroke="${palette.rule}"/><rect x="14" y="14" width="1172" height="302" fill="url(#carto-grid)"/>
      <rect x="29" y="29" width="235" height="272" fill="${palette.panel}" fill-opacity=".62" stroke="${palette.rule}"/><text x="50" y="54" class="carto-mono" font-size="8" letter-spacing="2.1" fill="${palette.verdigris}">TRIANGULATION</text><text x="50" y="91" class="carto-serif" font-size="21" font-style="italic" fill="${palette.ink}">Contour survey</text>
      <use href="#carto-hill" transform="translate(146 148) scale(1.1)"/>
      <text x="146" y="222" text-anchor="middle" class="carto-serif" font-size="52" font-weight="700" fill="${palette.ink}">${String(config.layers.length).padStart(2, "0")}</text><text x="146" y="246" text-anchor="middle" class="carto-mono" font-size="8" letter-spacing="1.8" fill="${palette.sienna}">LAYERS CHARTED</text><text x="50" y="280" class="carto-label" font-size="9" fill="${palette.muted}">${escapeXml(shorten(config.identity.name, 24).toUpperCase())}</text>
      <text x="309" y="40" class="carto-mono" font-size="10" letter-spacing="2" fill="${palette.verdigris}">CARTOGRAPH / CONTOUR INDEX</text><text x="1146" y="40" text-anchor="end" class="carto-mono" font-size="8" letter-spacing="1.4" fill="${palette.muted}">${escapeXml(shorten(config.identity.headline, 38).toUpperCase())}</text><path d="M309 52H1146" stroke="${palette.rule}"/><path d="M727 61V303" stroke="${palette.rule}"/>
      ${surveyRows(config, palette)}<circle cx="1129" cy="293" r="3" fill="${palette.userPrimary}"/><circle cx="1141" cy="293" r="3" fill="${palette.userSecondary}"/>
    </svg>`;
  }
}
