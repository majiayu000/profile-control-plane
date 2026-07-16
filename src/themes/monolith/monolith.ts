import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
} from "../../core/types.js";
import { shorten, toneColor } from "../shared.js";

interface MonolithPalette {
  readonly background: string;
  readonly ink: string;
  readonly muted: string;
  readonly line: string;
  readonly mass: string;
  readonly reverse: string;
  readonly red: string;
  readonly blue: string;
  readonly primary: string;
  readonly secondary: string;
}

function createMonolithPalette(
  config: ProfileConfig,
  mode: ColorMode,
): MonolithPalette {
  return mode === "dark"
    ? {
        background: "#151411",
        ink: "#F0E8D9",
        muted: "#A0988C",
        line: "#4A463F",
        mass: "#E8DFCF",
        reverse: "#151411",
        red: "#AD4935",
        blue: "#365A72",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      }
    : {
        background: "#F0E8D9",
        ink: "#171613",
        muted: "#6E675D",
        line: "#BDB2A1",
        mass: "#1B1A17",
        reverse: "#F0E8D9",
        red: "#B24430",
        blue: "#315A73",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      };
}

function monolithStyle(): string {
  return `<style>
    .display{font-family:"Avenir Next Condensed","Helvetica Neue Condensed","Arial Narrow",sans-serif}.body{font-family:"Gill Sans","Trebuchet MS",sans-serif}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .monolith-rise{animation:monolith-rise .72s cubic-bezier(.2,.76,.2,1) both}
    @keyframes monolith-rise{from{opacity:.18;transform:translateY(15px)}to{opacity:1;transform:translateY(0)}}
    @media(prefers-reduced-motion:reduce){.monolith-rise{animation:none}}
  </style>`;
}

function splitMonolithHeadline(value: string): readonly [string, string] {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= 23) return [normalized, ""];

  const midpoint = Math.floor(normalized.length / 2);
  const spaces = [...normalized.matchAll(/ /g)]
    .map((match) => match.index)
    .filter((index): index is number => index !== undefined);
  const splitAt =
    spaces.length > 0
      ? spaces.reduce((nearest, candidate) =>
          Math.abs(candidate - midpoint) < Math.abs(nearest - midpoint)
            ? candidate
            : nearest,
        )
      : midpoint;
  return [
    shorten(normalized.slice(0, splitAt).trim(), 24),
    shorten(normalized.slice(splitAt).trim(), 24),
  ];
}

function flagshipIndex(
  config: ProfileConfig,
  palette: MonolithPalette,
): string {
  const count = config.flagships.length;
  const columns = count > 3 ? 2 : 1;
  const rows = Math.ceil(count / columns);
  const rowGap = rows <= 1 ? 0 : Math.min(82, 168 / (rows - 1));
  const startY = rows <= 1 ? 171 : 87;

  return config.flagships
    .map((project, index) => {
      const column = Math.floor(index / rows);
      const row = index % rows;
      const x = columns === 1 ? 818 : 754 + column * 220;
      const y = startY + row * rowGap;
      const accent = toneColor(project.tone, palette);
      const delay = 120 + index * 55;
      return `<g class="monolith-rise" style="animation-delay:${delay}ms">
        <path d="M${x} ${y - 22}H${x + 190}" stroke="${palette.line}"/>
        <rect x="${x}" y="${y - 18}" width="4" height="28" fill="${accent}"/>
        <text x="${x + 13}" y="${y - 8}" class="mono" font-size="7.5" letter-spacing="1.4" fill="${index % 2 === 0 ? palette.red : palette.blue}">${String(index + 1).padStart(2, "0")} / ${escapeXml(shorten(project.role, 12).toUpperCase())}</text>
        <text x="${x + 13}" y="${y + 11}" class="body" font-size="13" font-weight="700" fill="${palette.ink}">${escapeXml(shorten(project.repo, 20))}</text>
        <text x="${x + 13}" y="${y + 28}" class="body" font-size="8.5" fill="${palette.muted}">${escapeXml(shorten(project.description, 27))}</text>
      </g>`;
    })
    .join("");
}

function layerIndex(config: ProfileConfig, palette: MonolithPalette): string {
  const count = config.layers.length;
  const columns = count > 5 ? 2 : 1;
  const rows = Math.ceil(count / columns);
  const rowGap = rows <= 1 ? 0 : Math.min(50, 200 / (rows - 1));
  const startY = rows <= 1 ? 166 : 78;

  return config.layers
    .map((layer, index) => {
      const column = Math.floor(index / rows);
      const row = index % rows;
      const x = columns === 1 ? 412 : 342 + column * 418;
      const y = startY + row * rowGap;
      const accent = toneColor(layer.tone, palette);
      return `<g class="monolith-rise" style="animation-delay:${index * 45}ms">
        <path d="M${x} ${y + 22}H${x + 380}" stroke="${palette.line}"/>
        <rect x="${x}" y="${y - 13}" width="3" height="30" fill="${accent}"/>
        <text x="${x + 13}" y="${y - 2}" class="mono" font-size="8" letter-spacing="1.5" fill="${index % 2 === 0 ? palette.red : palette.blue}">${String(index + 1).padStart(2, "0")}</text>
        <text x="${x + 50}" y="${y - 2}" class="body" font-size="12" font-weight="700" fill="${palette.ink}">${escapeXml(shorten(layer.name, 17))}</text>
        <text x="${x + 190}" y="${y - 2}" class="display" font-size="12" font-style="italic" fill="${palette.ink}">${escapeXml(shorten(layer.project, 22))}</text>
        <text x="${x + 50}" y="${y + 15}" class="body" font-size="8.5" fill="${palette.muted}">${escapeXml(shorten(layer.description, 45))}</text>
      </g>`;
    })
    .join("");
}

export class MonolithRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createMonolithPalette(config, mode);
    const [lineOne, lineTwo] = splitMonolithHeadline(config.identity.headline);
    const longest = Math.max(lineOne.length, lineTwo.length);
    const headlineSize = longest > 20 ? 43 : longest > 15 ? 50 : 58;
    const location = config.identity.location
      ? `<text x="252" y="337" class="mono" font-size="8" letter-spacing="1.8" fill="${palette.muted}">${escapeXml(shorten(config.identity.location, 28).toUpperCase())}</text>`
      : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} monolith profile" data-mode="${mode}">
      ${monolithStyle()}<rect width="1200" height="360" fill="${palette.background}"/>
      <text x="-26" y="303" class="display" font-size="348" font-weight="900" letter-spacing="-34" fill="${palette.mass}">M</text>
      <rect x="17" y="19" width="8" height="72" fill="${palette.red}"/><rect x="31" y="19" width="8" height="43" fill="${palette.blue}"/>
      <text x="91" y="327" transform="rotate(-90 91 327)" class="mono" font-size="8" letter-spacing="4" fill="${palette.reverse}">MASS / FORM / EVIDENCE</text>
      <g class="monolith-rise"><text x="252" y="34" class="mono" font-size="8" letter-spacing="2.5" fill="${palette.red}">MONOLITH / MASS STUDY</text>
      <text x="706" y="34" text-anchor="end" class="mono" font-size="8" letter-spacing="1.8" fill="${palette.muted}">${escapeXml(shorten(config.identity.name, 30).toUpperCase())}</text><path d="M252 48H706" stroke="${palette.line}"/>
      <text x="248" y="121" class="display" font-size="${headlineSize}" font-weight="700" letter-spacing="-1.8" fill="${palette.ink}">${escapeXml(lineOne)}</text>${lineTwo ? `<text x="248" y="${121 + headlineSize}" class="display" font-size="${headlineSize}" font-style="italic" letter-spacing="-1.8" fill="${palette.ink}">${escapeXml(lineTwo)}</text>` : ""}
      <path d="M252 232H292" stroke="${palette.blue}" stroke-width="5"/><text x="252" y="260" class="body" font-size="11" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 68))}</text></g>
      <text x="754" y="34" class="mono" font-size="8" letter-spacing="2.2" fill="${palette.blue}">PROOF INDEX / ${String(config.flagships.length).padStart(2, "0")}</text>${flagshipIndex(config, palette)}
      <path d="M236 316H1172" stroke="${palette.line}"/><rect x="236" y="313" width="78" height="6" fill="${palette.red}"/><rect x="314" y="313" width="42" height="6" fill="${palette.blue}"/>
      <text x="706" y="337" text-anchor="end" class="mono" font-size="8" letter-spacing="1.6" fill="${palette.ink}">${String(config.layers.length).padStart(2, "0")} STRATA</text><text x="1172" y="337" text-anchor="end" class="mono" font-size="8" letter-spacing="1.6" fill="${palette.muted}">${String(config.flagships.length).padStart(2, "0")} FLAGSHIP WORKS</text>${location}
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createMonolithPalette(config, mode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} monolith strata index" data-mode="${mode}">
      ${monolithStyle()}<rect width="1200" height="330" fill="${palette.background}"/>
      <text x="-18" y="279" class="display" font-size="276" font-weight="900" letter-spacing="-20" fill="${palette.mass}">${String(config.layers.length).padStart(2, "0")}</text>
      <rect x="19" y="18" width="7" height="66" fill="${palette.red}"/><rect x="32" y="18" width="7" height="38" fill="${palette.blue}"/>
      <text x="280" y="35" class="mono" font-size="8" letter-spacing="2.6" fill="${palette.red}">MONOLITH / STRATA INDEX</text><text x="1170" y="35" text-anchor="end" class="mono" font-size="8" letter-spacing="1.8" fill="${palette.muted}">${escapeXml(shorten(config.identity.headline, 42).toUpperCase())}</text>
      <path d="M280 49H1170" stroke="${palette.line}"/><path d="M300 64V302" stroke="${palette.line}"/>
      ${layerIndex(config, palette)}
      <text x="76" y="307" transform="rotate(-90 76 307)" class="mono" font-size="8" letter-spacing="3.4" fill="${palette.reverse}">ACTIVE STRATA</text>
      <rect x="280" y="306" width="890" height="3" fill="${palette.blue}"/><rect x="280" y="306" width="${Math.max(36, config.layers.length * 23)}" height="3" fill="${palette.red}"/>
    </svg>`;
  }
}
