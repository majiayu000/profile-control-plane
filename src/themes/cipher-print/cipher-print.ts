import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
  Tone,
} from "../../core/types.js";
import { shorten } from "../shared.js";

interface CipherPalette {
  readonly background: string;
  readonly paper: string;
  readonly paperLift: string;
  readonly ink: string;
  readonly muted: string;
  readonly rule: string;
  readonly grape: string;
  readonly verdigris: string;
  readonly vermilion: string;
  readonly userPrimary: string;
  readonly userSecondary: string;
}

function createCipherPalette(
  config: ProfileConfig,
  mode: ColorMode,
): CipherPalette {
  const accents = {
    userPrimary: escapeXml(config.theme.primary),
    userSecondary: escapeXml(config.theme.secondary),
  };
  return mode === "dark"
    ? {
        background: "#17131A",
        paper: "#29212D",
        paperLift: "#332839",
        ink: "#F4E8D2",
        muted: "#B9AAAF",
        rule: "#594B5D",
        grape: "#A47AAA",
        verdigris: "#62A493",
        vermilion: "#D86A55",
        ...accents,
      }
    : {
        background: "#D4C4AB",
        paper: "#F3E8D2",
        paperLift: "#FBF2E2",
        ink: "#35283A",
        muted: "#776B70",
        rule: "#B8A58F",
        grape: "#68466E",
        verdigris: "#337B6D",
        vermilion: "#B84837",
        ...accents,
      };
}

function cipherStyle(): string {
  return `<style>
    .cipher-display{font-family:Iowan Old Style,Palatino Linotype,Book Antiqua,Georgia,serif}.cipher-label{font-family:Avenir Next Condensed,Arial Narrow,sans-serif}.cipher-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .cipher-orbit{transform-box:fill-box;transform-origin:center;animation:cipher-orbit 22s linear infinite}.cipher-thread{stroke-dasharray:2 12;animation:cipher-thread 8s linear infinite}.cipher-reveal{animation:cipher-reveal .72s cubic-bezier(.2,.75,.2,1) both}
    @keyframes cipher-orbit{to{transform:rotate(360deg)}}@keyframes cipher-thread{to{stroke-dashoffset:-112}}@keyframes cipher-reveal{from{opacity:.18;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @media(prefers-reduced-motion:reduce){.cipher-orbit,.cipher-thread,.cipher-reveal{animation:none}}
  </style>`;
}

function cipherDefs(palette: CipherPalette): string {
  return `<defs>
    <pattern id="cipher-paper" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="${palette.rule}" stroke-opacity=".13"/><circle cx="4" cy="4" r=".65" fill="${palette.rule}" fill-opacity=".2"/></pattern>
    <pattern id="cipher-weave" width="72" height="24" patternUnits="userSpaceOnUse"><path d="M-18 12C0-3 18-3 36 12S72 27 90 12" fill="none" stroke="${palette.grape}" stroke-opacity=".2"/><path d="M-18 12C0 27 18 27 36 12S72-3 90 12" fill="none" stroke="${palette.verdigris}" stroke-opacity=".18"/></pattern>
    <g id="cipher-rosette" fill="none"><ellipse rx="96" ry="31" stroke="${palette.grape}"/><ellipse rx="96" ry="31" transform="rotate(30)" stroke="${palette.verdigris}"/><ellipse rx="96" ry="31" transform="rotate(60)" stroke="${palette.grape}"/><ellipse rx="96" ry="31" transform="rotate(90)" stroke="${palette.vermilion}"/><ellipse rx="96" ry="31" transform="rotate(120)" stroke="${palette.grape}"/><ellipse rx="96" ry="31" transform="rotate(150)" stroke="${palette.verdigris}"/><circle r="67" stroke="${palette.rule}" stroke-dasharray="1 5"/><circle r="18" stroke="${palette.vermilion}"/></g>
  </defs>`;
}

function splitCipherHeadline(value: string): readonly [string, string] {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= 23) return [normalized, ""];
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

function cipherToneInk(tone: Tone, palette: CipherPalette): string {
  return tone === "primary" ? palette.verdigris : palette.vermilion;
}

function flagshipRegister(
  config: ProfileConfig,
  palette: CipherPalette,
): string {
  const limit = 6;
  const rows = config.flagships
    .slice(0, limit)
    .map((project, index) => {
      const y = 79 + index * 43;
      const accent = cipherToneInk(project.tone, palette);
      return `<g class="cipher-reveal" style="animation-delay:${90 + index * 55}ms">
        <circle cx="697" cy="${y - 5}" r="7" fill="${palette.paperLift}" stroke="${accent}"/><circle cx="697" cy="${y - 5}" r="2" fill="${accent}"/>
        <text x="717" y="${y - 8}" class="cipher-label" font-size="12" font-weight="800" fill="${palette.ink}">${escapeXml(shorten(project.repo, 27))}</text><text x="1138" y="${y - 8}" text-anchor="end" class="cipher-mono" font-size="7.5" letter-spacing="1.4" fill="${accent}">${escapeXml(shorten(project.role, 18).toUpperCase())}</text>
        <text x="717" y="${y + 10}" class="cipher-label" font-size="9" fill="${palette.muted}">${escapeXml(shorten(project.description, 66))}</text><path d="M717 ${y + 19}H1138" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
  const remainder = config.flagships.length - limit;
  const overflow =
    remainder > 0
      ? `<text x="1138" y="48" text-anchor="end" class="cipher-mono" font-size="8" letter-spacing="1.4" fill="${palette.vermilion}">+${remainder} IN FULL REGISTER</text>`
      : `<text x="1138" y="48" text-anchor="end" class="cipher-mono" font-size="8" letter-spacing="1.4" fill="${palette.muted}">${String(config.flagships.length).padStart(2, "0")} IMPRESSIONS</text>`;
  return `${overflow}${rows}`;
}

function layerRegister(config: ProfileConfig, palette: CipherPalette): string {
  const limit = 10;
  const rows = config.layers
    .slice(0, limit)
    .map((layer, index) => {
      const column = Math.floor(index / 5);
      const row = index % 5;
      const x = 250 + column * 466;
      const y = 78 + row * 48;
      const accent = cipherToneInk(layer.tone, palette);
      return `<g class="cipher-reveal" style="animation-delay:${index * 42}ms">
        <circle cx="${x}" cy="${y - 4}" r="9" fill="none" stroke="${accent}" stroke-dasharray="2 2"/><text x="${x}" y="${y - 1}" text-anchor="middle" class="cipher-mono" font-size="7" fill="${accent}">${String(index + 1).padStart(2, "0")}</text>
        <text x="${x + 20}" y="${y - 7}" class="cipher-label" font-size="11" font-weight="800" fill="${palette.ink}">${escapeXml(shorten(layer.name, 17))}</text><text x="${x + 174}" y="${y - 7}" class="cipher-display" font-size="11" font-style="italic" fill="${accent}">${escapeXml(shorten(layer.project, 23))}</text>
        <text x="${x + 20}" y="${y + 10}" class="cipher-label" font-size="8.5" fill="${palette.muted}">${escapeXml(shorten(layer.description, 58))}</text><path d="M${x + 20} ${y + 18}H${x + 426}" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
  const remainder = config.layers.length - limit;
  return `${rows}${remainder > 0 ? `<text x="1146" y="40" text-anchor="end" class="cipher-mono" font-size="8" fill="${palette.vermilion}">+${remainder} LAYERS IN FULL REGISTER</text>` : ""}`;
}

export class CipherPrintRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createCipherPalette(config, mode);
    const [headlineOne, headlineTwo] = splitCipherHeadline(
      config.identity.headline,
    );
    const location = config.identity.location
      ? escapeXml(shorten(config.identity.location, 27).toUpperCase())
      : "OPEN EDITION";
    const headlineSize =
      Math.max(headlineOne.length, headlineTwo.length) > 25 ? 31 : 36;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} cipher print profile" data-mode="${mode}">
      ${cipherDefs(palette)}${cipherStyle()}<rect width="1200" height="360" fill="${palette.background}"/><rect x="14" y="14" width="1172" height="332" rx="2" fill="${palette.paper}" stroke="${palette.rule}"/><rect x="14" y="14" width="1172" height="332" fill="url(#cipher-paper)"/>
      <rect x="28" y="28" width="620" height="304" fill="none" stroke="${palette.rule}"/><rect x="663" y="28" width="494" height="304" fill="${palette.paperLift}" fill-opacity=".38" stroke="${palette.rule}"/><path d="M672 57H1145" stroke="${palette.grape}"/><path class="cipher-thread" d="M672 59H1145" stroke="${palette.verdigris}" stroke-width="2"/>
      <g transform="translate(582 181)" opacity=".27"><use class="cipher-orbit" href="#cipher-rosette"/></g><rect x="28" y="294" width="620" height="38" fill="url(#cipher-weave)"/>
      <g class="cipher-reveal"><text x="52" y="51" class="cipher-mono" font-size="8" letter-spacing="2.5" fill="${palette.verdigris}">CIPHER PRINT / OPEN SYSTEMS FOLIO</text><text x="624" y="51" text-anchor="end" class="cipher-mono" font-size="8" letter-spacing="1.5" fill="${palette.muted}">PLATE ${String(config.layers.length).padStart(2, "0")} · ${location}</text>
      <text x="52" y="83" class="cipher-label" font-size="12" font-weight="800" letter-spacing="2" fill="${palette.grape}">${escapeXml(shorten(config.identity.name, 28).toUpperCase())}</text>
      <text x="49" y="137" class="cipher-display" font-size="${headlineSize}" font-weight="700" fill="${palette.ink}">${escapeXml(headlineOne)}</text>${headlineTwo ? `<text x="49" y="${137 + headlineSize}" class="cipher-display" font-size="${headlineSize}" font-style="italic" fill="${palette.ink}">${escapeXml(headlineTwo)}</text>` : ""}
      <path d="M52 213H392" stroke="${palette.vermilion}" stroke-width="3"/><text x="52" y="241" class="cipher-label" font-size="11" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 82))}</text>
      <text x="52" y="278" class="cipher-mono" font-size="8" letter-spacing="1.7" fill="${palette.ink}">ROSETTE ${String(config.flagships.length).padStart(2, "0")} / LAYER REGISTER ${String(config.layers.length).padStart(2, "0")}</text></g>
      <text x="687" y="48" class="cipher-display" font-size="16" font-style="italic" fill="${palette.ink}">Flagship impressions</text>${flagshipRegister(config, palette)}
      <circle cx="43" cy="315" r="3" fill="${palette.userPrimary}"/><circle cx="55" cy="315" r="3" fill="${palette.userSecondary}"/><path d="M67 315H116" stroke="${palette.ink}"/><path d="M1145 315h-22m11-11v22" stroke="${palette.vermilion}"/>
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createCipherPalette(config, mode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} cipher layer register" data-mode="${mode}">
      ${cipherDefs(palette)}${cipherStyle()}<rect width="1200" height="330" fill="${palette.background}"/><rect x="14" y="14" width="1172" height="302" fill="${palette.paper}" stroke="${palette.rule}"/><rect x="14" y="14" width="1172" height="302" fill="url(#cipher-paper)"/>
      <rect x="29" y="29" width="184" height="272" fill="${palette.paperLift}" fill-opacity=".48" stroke="${palette.rule}"/><g transform="translate(121 154) scale(.62)" opacity=".65"><use class="cipher-orbit" href="#cipher-rosette"/></g>
      <text x="52" y="55" class="cipher-mono" font-size="8" letter-spacing="2.2" fill="${palette.verdigris}">ROSETTE INDEX</text><text x="121" y="142" text-anchor="middle" class="cipher-display" font-size="56" font-weight="700" fill="${palette.ink}">${String(config.layers.length).padStart(2, "0")}</text><text x="121" y="222" text-anchor="middle" class="cipher-mono" font-size="8" letter-spacing="2" fill="${palette.grape}">LAYER PLATES</text><path class="cipher-thread" d="M52 245H190" stroke="${palette.vermilion}" stroke-width="2"/><text x="121" y="276" text-anchor="middle" class="cipher-label" font-size="9" fill="${palette.muted}">${escapeXml(shorten(config.identity.name, 22).toUpperCase())}</text>
      <text x="249" y="40" class="cipher-display" font-size="17" font-style="italic" fill="${palette.ink}">LAYER REGISTER / GUILLOCHÉ KEY</text><text x="1146" y="40" text-anchor="end" class="cipher-mono" font-size="8" letter-spacing="1.5" fill="${palette.muted}">${escapeXml(shorten(config.identity.headline, 38).toUpperCase())}</text><path d="M249 52H1146" stroke="${palette.rule}"/><path d="M696 61V303" stroke="${palette.rule}"/>
      ${layerRegister(config, palette)}<rect x="249" y="288" width="897" height="14" fill="url(#cipher-weave)"/><circle cx="1128" cy="295" r="3" fill="${palette.userPrimary}"/><circle cx="1139" cy="295" r="3" fill="${palette.userSecondary}"/>
    </svg>`;
  }
}
