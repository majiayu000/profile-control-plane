import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
} from "../../core/types.js";
import { shorten, toneColor } from "../shared.js";

interface InterlacePalette {
  readonly canvas: string;
  readonly ink: string;
  readonly muted: string;
  readonly rule: string;
  readonly warp: string;
  readonly warpAlternate: string;
  readonly clay: string;
  readonly indigo: string;
  readonly threadInk: string;
  readonly fiber: string;
  readonly primary: string;
  readonly secondary: string;
}

interface LoomGeometry {
  readonly id: string;
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
  readonly warpXs: readonly number[];
  readonly weftYs: readonly number[];
  readonly threadWidth: number;
}

function createInterlacePalette(
  config: ProfileConfig,
  mode: ColorMode,
): InterlacePalette {
  return mode === "dark"
    ? {
        canvas: "#241F19",
        ink: "#F1E5CF",
        muted: "#B7A990",
        rule: "#5B5042",
        warp: "#C09A61",
        warpAlternate: "#8A6843",
        clay: "#A84D3B",
        indigo: "#355969",
        threadInk: "#F8EBD4",
        fiber: "#F4DDAF",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      }
    : {
        canvas: "#F1E5CF",
        ink: "#28231D",
        muted: "#756957",
        rule: "#C8B99F",
        warp: "#B68C53",
        warpAlternate: "#80603E",
        clay: "#A94836",
        indigo: "#365C6D",
        threadInk: "#FFF0D5",
        fiber: "#FFE7B9",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      };
}

function interlaceStyle(): string {
  return `<style>
    .display{font-family:"Iowan Old Style","Palatino Linotype",Palatino,serif}.body{font-family:Optima,Candara,"Avenir Next",sans-serif}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .interlace-shuttle{stroke-dasharray:1 99;animation:interlace-shuttle 7.6s linear infinite}
    .interlace-settle{animation:interlace-settle .7s cubic-bezier(.2,.75,.2,1) both}
    @keyframes interlace-shuttle{to{stroke-dashoffset:-100}}@keyframes interlace-settle{from{opacity:.2;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
    @media(prefers-reduced-motion:reduce){.interlace-shuttle,.interlace-settle{animation:none}}
  </style>`;
}

function breakInterlaceHeadline(value: string): readonly [string, string] {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= 17) return [normalized, ""];
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
    shorten(normalized.slice(0, splitAt).trim(), 25),
    shorten(normalized.slice(splitAt).trim(), 25),
  ];
}

function interlacePositions(
  count: number,
  start: number,
  end: number,
): readonly number[] {
  if (count <= 1) return [(start + end) / 2];
  return Array.from(
    { length: count },
    (_, index) => start + (index * (end - start)) / (count - 1),
  );
}

function warpPath(x: number, geometry: LoomGeometry): string {
  const height = geometry.y1 - geometry.y0;
  return `M${x} ${geometry.y0}C${x - 5} ${(geometry.y0 + height * 0.31).toFixed(1)} ${x + 5} ${(geometry.y0 + height * 0.68).toFixed(1)} ${x} ${geometry.y1}`;
}

function weftPath(y: number, geometry: LoomGeometry): string {
  const width = geometry.x1 - geometry.x0;
  return `M${geometry.x0} ${y}C${(geometry.x0 + width * 0.28).toFixed(1)} ${y - 3} ${(geometry.x0 + width * 0.7).toFixed(1)} ${y + 3} ${geometry.x1} ${y}`;
}

function loom(geometry: LoomGeometry, palette: InterlacePalette): string {
  const clipRects = geometry.warpXs
    .flatMap((x, warpIndex) =>
      geometry.weftYs.map((y, weftIndex) =>
        (warpIndex + weftIndex) % 2 === 0
          ? `<rect x="${x - geometry.threadWidth / 2 - 2}" y="${y - geometry.threadWidth / 2 - 2}" width="${geometry.threadWidth + 4}" height="${geometry.threadWidth + 4}"/>`
          : "",
      ),
    )
    .join("");
  const warps = geometry.warpXs
    .map((x, index) => {
      const path = warpPath(x, geometry);
      const color = index % 2 === 0 ? palette.warp : palette.warpAlternate;
      return `<path d="${path}" fill="none" stroke="${color}" stroke-width="${geometry.threadWidth}" stroke-linecap="butt"/><path d="${path}" fill="none" stroke="${palette.fiber}" stroke-width="1" stroke-opacity=".3"/>`;
    })
    .join("");
  const wefts = geometry.weftYs
    .map((y, index) => {
      const path = weftPath(y, geometry);
      const color = index % 2 === 0 ? palette.clay : palette.indigo;
      return `<path d="${path}" fill="none" stroke="${color}" stroke-width="${geometry.threadWidth}" stroke-linecap="butt"/><path d="${path}" fill="none" stroke="${palette.fiber}" stroke-width="1" stroke-opacity=".24"/>`;
    })
    .join("");
  const shuttleY = geometry.weftYs[Math.floor(geometry.weftYs.length / 2)];
  const shuttle =
    shuttleY === undefined
      ? ""
      : `<path class="interlace-shuttle" pathLength="100" d="${weftPath(shuttleY + geometry.threadWidth * 0.38, geometry)}" fill="none" stroke="${palette.threadInk}" stroke-width="2" stroke-opacity=".82" stroke-linecap="square"/>`;

  return `<defs><clipPath id="${geometry.id}-warp-over">${clipRects}</clipPath></defs>
    <g class="interlace-settle">${warps}${wefts}<g clip-path="url(#${geometry.id}-warp-over)">${warps}</g>${shuttle}</g>`;
}

function flagshipThreads(
  config: ProfileConfig,
  palette: InterlacePalette,
  rows: readonly number[],
): string {
  return config.flagships
    .map((project, index) => {
      const y = rows[index];
      if (y === undefined) return "";
      const accent = toneColor(project.tone, palette);
      return `<g class="interlace-settle" style="animation-delay:${index * 55}ms">
        <rect x="626" y="${y - 8}" width="4" height="16" fill="${accent}"/>
        <text x="643" y="${y + 4}" class="body" font-size="11" font-weight="700" fill="${palette.threadInk}">${escapeXml(shorten(project.repo, 18))}</text>
        <text x="816" y="${y + 4}" text-anchor="end" class="mono" font-size="7.5" letter-spacing="1.1" fill="${palette.threadInk}">${escapeXml(shorten(project.role, 12).toUpperCase())}</text>
        <text x="1155" y="${y + 4}" text-anchor="end" class="mono" font-size="7" fill="${palette.threadInk}">${String(index + 1).padStart(2, "0")}</text>
      </g>`;
    })
    .join("");
}

function layerThreads(
  config: ProfileConfig,
  palette: InterlacePalette,
  rows: readonly number[],
): string {
  return config.layers
    .map((layer, index) => {
      const y = rows[index];
      if (y === undefined) return "";
      const accent = toneColor(layer.tone, palette);
      return `<g class="interlace-settle" style="animation-delay:${index * 38}ms">
        <rect x="32" y="${y - 7}" width="4" height="14" fill="${accent}"/>
        <text x="48" y="${y + 3}" class="body" font-size="10" font-weight="700" fill="${palette.ink}">${escapeXml(shorten(layer.name, 17))}</text>
        <text x="184" y="${y + 3}" class="display" font-size="10.5" font-style="italic" fill="${palette.muted}">${escapeXml(shorten(layer.project, 21))}</text>
        <text x="344" y="${y + 3}" text-anchor="end" class="mono" font-size="7.5" fill="${palette.muted}">${String(index + 1).padStart(2, "0")}</text>
      </g>`;
    })
    .join("");
}

export class InterlaceRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createInterlacePalette(config, mode);
    const [lineOne, lineTwo] = breakInterlaceHeadline(config.identity.headline);
    const longest = Math.max(lineOne.length, lineTwo.length);
    const headlineSize = longest > 21 ? 35 : longest > 16 ? 43 : 52;
    const rows = interlacePositions(config.flagships.length, 72, 288);
    const geometry: LoomGeometry = {
      id: "interlace-hero",
      x0: 624,
      x1: 1170,
      y0: 48,
      y1: 314,
      warpXs: [834, 903, 972, 1041, 1110],
      weftYs: rows,
      threadWidth: 27,
    };
    const location = config.identity.location
      ? `<text x="42" y="334" class="mono" font-size="8" letter-spacing="1.5" fill="${palette.muted}">STUDIO / ${escapeXml(shorten(config.identity.location, 28).toUpperCase())}</text>`
      : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} interlaced portfolio" data-mode="${mode}">
      ${interlaceStyle()}<rect width="1200" height="360" fill="${palette.canvas}"/>
      <path d="M600 24V336" stroke="${palette.rule}"/><path d="M42 45H570" stroke="${palette.rule}"/>
      <g class="interlace-settle"><text x="42" y="32" class="mono" font-size="8" letter-spacing="2.6" fill="${palette.clay}">INTERLACE / OPEN LOOM</text><text x="570" y="32" text-anchor="end" class="mono" font-size="8" letter-spacing="1.5" fill="${palette.muted}">${escapeXml(shorten(config.identity.name, 28).toUpperCase())}</text>
      <text x="40" y="126" class="display" font-size="${headlineSize}" font-weight="700" letter-spacing="-1.1" fill="${palette.ink}">${escapeXml(lineOne)}</text>${lineTwo ? `<text x="40" y="${126 + headlineSize}" class="display" font-size="${headlineSize}" font-style="italic" letter-spacing="-1.1" fill="${palette.ink}">${escapeXml(lineTwo)}</text>` : ""}
      <path d="M42 230H86" stroke="${palette.indigo}" stroke-width="6"/><text x="42" y="260" class="body" font-size="12" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 66))}</text>
      <text x="42" y="302" class="mono" font-size="8" letter-spacing="1.8" fill="${palette.ink}">${String(config.flagships.length).padStart(2, "0")} PROOF THREADS</text><text x="238" y="302" class="mono" font-size="8" letter-spacing="1.8" fill="${palette.ink}">${String(config.layers.length).padStart(2, "0")} WARP LAYERS</text></g>
      <text x="624" y="31" class="mono" font-size="8" letter-spacing="2.2" fill="${palette.indigo}">SELVEDGE / SELECTED WORK</text>${loom(geometry, palette)}${flagshipThreads(config, palette, rows)}${location}
      <path d="M24 336H1176" stroke="${palette.rule}"/><rect x="1128" y="332" width="48" height="8" fill="${palette.primary}"/><rect x="1096" y="332" width="24" height="8" fill="${palette.secondary}"/>
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createInterlacePalette(config, mode);
    const rows = interlacePositions(config.layers.length, 60, 286);
    const geometry: LoomGeometry = {
      id: "interlace-loop",
      x0: 366,
      x1: 1170,
      y0: 44,
      y1: 306,
      warpXs: [486, 596, 706, 816, 926, 1036, 1146],
      weftYs: rows,
      threadWidth: Math.max(14, Math.min(22, 150 / config.layers.length)),
    };
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} interlace weave map" data-mode="${mode}">
      ${interlaceStyle()}<rect width="1200" height="330" fill="${palette.canvas}"/>
      <text x="32" y="28" class="mono" font-size="8" letter-spacing="2.6" fill="${palette.clay}">INTERLACE / WEAVE MAP</text><text x="1170" y="28" text-anchor="end" class="mono" font-size="8" letter-spacing="1.8" fill="${palette.muted}">${String(config.layers.length).padStart(2, "0")} THREADS / ONE CLOTH</text>
      <path d="M32 40H1170" stroke="${palette.rule}"/><path d="M358 44V306" stroke="${palette.rule}"/>
      ${loom(geometry, palette)}${layerThreads(config, palette, rows)}
      <text x="32" y="318" class="mono" font-size="7.5" letter-spacing="1.8" fill="${palette.muted}">${escapeXml(shorten(config.identity.headline, 42).toUpperCase())}</text>
      <rect x="1088" y="314" width="48" height="6" fill="${palette.primary}"/><rect x="1140" y="314" width="30" height="6" fill="${palette.secondary}"/>
    </svg>`;
  }
}
