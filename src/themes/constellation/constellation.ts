import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
} from "../../core/types.js";
import { shorten, toneColor } from "../shared.js";

interface ConstellationPalette {
  readonly background: string;
  readonly backgroundEnd: string;
  readonly star: string;
  readonly ink: string;
  readonly muted: string;
  readonly graticule: string;
  readonly panel: string;
  readonly frame: string;
  readonly glow: string;
  readonly primary: string;
  readonly secondary: string;
}

function createConstellationPalette(
  config: ProfileConfig,
  mode: ColorMode,
): ConstellationPalette {
  return mode === "dark"
    ? {
        background: "#050814",
        backgroundEnd: "#0B1026",
        star: "#E8ECFF",
        ink: "#E8ECFF",
        muted: "#8B93B8",
        graticule: "#4A5480",
        panel: "#0A0F22",
        frame: "#2A3358",
        glow: ` filter="url(#star-glow)"`,
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      }
    : {
        background: "#F5F1E6",
        backgroundEnd: "#EFE9D8",
        star: "#1E2A52",
        ink: "#1E2A52",
        muted: "#5C6485",
        graticule: "#9BA2BD",
        panel: "#F0EBDC",
        frame: "#8C93AF",
        glow: "",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      };
}

/** FNV-1a 32-bit string hash — deterministic pseudo-random source. */
function hash32(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Hash a seed to a unit interval value in [0, 1). */
function unit(seed: string): number {
  return hash32(seed) / 0x100000000;
}

function constellationStyle(): string {
  return `<style>
    .display{font-family:Georgia,"Times New Roman",serif}.body{font-family:"Avenir Next",Avenir,Helvetica,sans-serif}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .tw{animation:tw 3.4s ease-in-out infinite}
    @keyframes tw{50%{opacity:.2}}
    @media(prefers-reduced-motion:reduce){.tw{animation:none}}
  </style>`;
}

function constellationDefs(palette: ConstellationPalette): string {
  return `<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${palette.background}"/><stop offset="1" stop-color="${palette.backgroundEnd}"/></linearGradient>
    <linearGradient id="cline" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${palette.primary}"/><stop offset="1" stop-color="${palette.secondary}"/></linearGradient>
    <filter id="star-glow" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;
}

function starField(
  username: string,
  salt: string,
  width: number,
  height: number,
  palette: ConstellationPalette,
): string {
  const count = 44 + (hash32(`${username}:${salt}:count`) % 22);
  const stars: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const seed = `${username}:${salt}:${index}`;
    const x = (unit(`${seed}:x`) * width).toFixed(1);
    const y = (unit(`${seed}:y`) * height).toFixed(1);
    const bucket = hash32(`${seed}:r`) % 3;
    const radius = bucket === 0 ? "0.7" : bucket === 1 ? "1.1" : "1.7";
    const opacity = bucket === 2 ? ".85" : ".55";
    const twinkles = hash32(`${seed}:tw`) % 3 === 0;
    const delay = (unit(`${seed}:d`) * 3.4).toFixed(2);
    stars.push(
      twinkles
        ? `<circle class="tw" style="animation-delay:${delay}s" cx="${x}" cy="${y}" r="${radius}" fill="${palette.star}" opacity="${opacity}"/>`
        : `<circle cx="${x}" cy="${y}" r="${radius}" fill="${palette.star}" opacity="${opacity}"/>`,
    );
  }
  return stars.join("");
}

interface StarPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Place count points on a snake-ordered grid with hash-derived jitter:
 * deterministic, non-overlapping, and connectable as one polyline.
 */
function gridPoints(
  seed: string,
  count: number,
  columns: number,
  rows: number,
  x0: number,
  y0: number,
  width: number,
  height: number,
): readonly StarPoint[] {
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const points: StarPoint[] = [];
  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / columns);
    const column =
      row % 2 === 1 ? columns - 1 - (index % columns) : index % columns;
    const jitterX = (unit(`${seed}:jx:${index}`) - 0.5) * cellWidth * 0.5;
    const jitterY = (unit(`${seed}:jy:${index}`) - 0.5) * cellHeight * 0.5;
    points.push({
      x: x0 + cellWidth * (column + 0.5) + jitterX,
      y: y0 + cellHeight * (row + 0.5) + jitterY,
    });
  }
  return points;
}

function polylinePath(points: readonly StarPoint[]): string {
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
    )
    .join("");
}

function heroConstellation(
  config: ProfileConfig,
  palette: ConstellationPalette,
): string {
  const layers = config.layers.slice(0, 12);
  const seed = `${config.github.username}:hero`;
  const points = gridPoints(seed, layers.length, 4, 3, 560, 52, 596, 244);
  const line =
    points.length > 1
      ? `<path d="${polylinePath(points)}" fill="none" stroke="url(#cline)" stroke-width="1.3" stroke-opacity=".55"/>`
      : "";
  const stars = layers
    .map((layer, index) => {
      const point = points[index];
      if (!point) return "";
      const radius = Math.max(3.2, 8.5 - index * 0.5);
      const color = toneColor(layer.tone, palette);
      const x = point.x.toFixed(1);
      const y = point.y.toFixed(1);
      const labelY = (point.y - radius - 7).toFixed(1);
      return `<g>
        <circle cx="${x}" cy="${y}" r="${radius.toFixed(1)}" fill="${color}"${palette.glow}/>
        <text x="${x}" y="${labelY}" text-anchor="middle" class="mono" font-size="8" letter-spacing="1" fill="${palette.muted}">${escapeXml(shorten(layer.project, 18))}</text>
      </g>`;
    })
    .join("");
  return `${line}${stars}`;
}

function graticule(palette: ConstellationPalette): string {
  const stroke = `fill="none" stroke="${palette.graticule}" stroke-opacity=".45"`;
  return `<g>
    <ellipse cx="470" cy="163" rx="428" ry="122" ${stroke}/>
    <ellipse cx="470" cy="163" rx="290" ry="122" ${stroke} stroke-dasharray="2 5"/>
    <ellipse cx="470" cy="163" rx="140" ry="122" ${stroke} stroke-dasharray="2 5"/>
    <path d="M42 163H898" stroke="${palette.graticule}" stroke-opacity=".6"/>
  </g>`;
}

function loopConstellation(
  config: ProfileConfig,
  palette: ConstellationPalette,
): string {
  const layers = config.layers;
  const seed = `${config.github.username}:loop`;
  const columns = Math.max(1, Math.ceil(layers.length / 2));
  const rows = layers.length > 1 ? 2 : 1;
  const points = gridPoints(
    seed,
    layers.length,
    columns,
    rows,
    90,
    68,
    760,
    190,
  );
  const line =
    points.length > 1
      ? `<path d="${polylinePath(points)}" fill="none" stroke="url(#cline)" stroke-width="1.3" stroke-opacity=".55"/>`
      : "";
  const stars = layers
    .map((layer, index) => {
      const point = points[index];
      if (!point) return "";
      const radius = Math.max(3, 7.5 - index * 0.4);
      const color = toneColor(layer.tone, palette);
      const x = point.x.toFixed(1);
      const y = point.y.toFixed(1);
      const nameY = (point.y + radius + 14).toFixed(1);
      const projectY = (point.y + radius + 26).toFixed(1);
      return `<g>
        <circle cx="${x}" cy="${y}" r="${radius.toFixed(1)}" fill="${color}"${palette.glow}/>
        <text x="${x}" y="${nameY}" text-anchor="middle" class="body" font-size="10" font-weight="800" fill="${palette.ink}">${escapeXml(shorten(layer.name, 14))}</text>
        <text x="${x}" y="${projectY}" text-anchor="middle" class="mono" font-size="8" fill="${palette.muted}">${escapeXml(shorten(layer.project, 16))}</text>
      </g>`;
    })
    .join("");
  return `${line}${stars}`;
}

function loopLegend(
  config: ProfileConfig,
  palette: ConstellationPalette,
): string {
  const starCount = 44 + (hash32(`${config.github.username}:loop:count`) % 22);
  return `<g>
    <rect x="932" y="196" width="234" height="112" fill="${palette.panel}" stroke="${palette.frame}"/>
    <text x="948" y="217" class="mono" font-size="8" letter-spacing="2" fill="${palette.muted}">LEGEND</text>
    <circle cx="956" cy="234" r="5" fill="${palette.primary}"${palette.glow}/><text x="972" y="238" class="body" font-size="10" fill="${palette.ink}">Major star — layer</text>
    <circle cx="956" cy="256" r="2.2" fill="${palette.star}"/><text x="972" y="260" class="body" font-size="10" fill="${palette.ink}">Bright star — field</text>
    <path d="M949 278H963" stroke="url(#cline)" stroke-width="1.3"/><text x="972" y="282" class="body" font-size="10" fill="${palette.ink}">Constellation line</text>
    <text x="948" y="299" class="mono" font-size="8" letter-spacing="1.5" fill="${palette.muted}">${String(config.layers.length).padStart(2, "0")} MAJOR / ${starCount} FIELD STARS</text>
  </g>`;
}

export class ConstellationRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createConstellationPalette(config, mode);
    const location = config.identity.location
      ? `<text x="60" y="322" class="mono" font-size="9" letter-spacing="2" fill="${palette.muted}">OBSERVED FROM ${escapeXml(shorten(config.identity.location, 26).toUpperCase())}</text>`
      : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} constellation profile" data-mode="${mode}">
      ${constellationDefs(palette)}${constellationStyle()}<rect width="1200" height="360" fill="url(#sky)"/>
      ${starField(config.github.username, "hero", 1200, 360, palette)}
      <text x="60" y="96" class="mono" font-size="9" letter-spacing="3" fill="${palette.secondary}">STAR ATLAS / ${escapeXml(shorten(config.identity.headline, 42).toUpperCase())}</text>
      <text x="58" y="164" class="display" font-size="58" font-weight="700" letter-spacing="-1" fill="${palette.ink}">${escapeXml(shorten(config.identity.name, 24))}</text>
      <path d="M60 190H340" stroke="${palette.primary}" stroke-opacity=".7"/>
      <text x="60" y="222" class="body" font-size="13" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 70))}</text>
      <text x="60" y="258" class="mono" font-size="9" letter-spacing="2" fill="${palette.ink}">${String(config.layers.length).padStart(2, "0")} MAJOR STARS CHARTED</text>
      ${location}${heroConstellation(config, palette)}
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createConstellationPalette(config, mode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} star chart" data-mode="${mode}">
      ${constellationDefs(palette)}${constellationStyle()}<rect width="1200" height="330" fill="url(#sky)"/>
      ${starField(config.github.username, "loop", 1200, 330, palette)}
      <text x="42" y="34" class="display" font-size="17" font-style="italic" fill="${palette.ink}">Star chart</text>
      <text x="1166" y="34" text-anchor="end" class="mono" font-size="8" letter-spacing="2" fill="${palette.muted}">${escapeXml(shorten(config.identity.name, 30).toUpperCase())} / EPOCH 01</text>
      ${graticule(palette)}${loopConstellation(config, palette)}${loopLegend(config, palette)}
    </svg>`;
  }
}
