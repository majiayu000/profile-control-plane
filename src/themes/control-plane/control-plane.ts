import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
  Tone,
} from "../../core/types.js";
import { createPalette, type Palette } from "./palette.js";

const WIDTH = 1200;

function commonStyle(palette: Palette): string {
  return `<style>
    text{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace}
    .label{font-size:12px;letter-spacing:3px;font-weight:700}.micro{font-size:10px;letter-spacing:2px}
    .flow{stroke-dasharray:7 9;animation:flow 8s linear infinite}.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.4s ease-in-out infinite}
    .orbit{transform-box:fill-box;transform-origin:center;animation:orbit 24s linear infinite}.blink{animation:blink 2s ease-in-out infinite}
    @keyframes flow{to{stroke-dashoffset:-160}}@keyframes pulse{50%{opacity:.35;transform:scale(.72)}}
    @keyframes orbit{to{transform:rotate(360deg)}}@keyframes blink{50%{opacity:.35}}
    @media(prefers-reduced-motion:reduce){.flow,.pulse,.orbit,.blink{animation:none}}
  </style>`;
}

function definitions(palette: Palette): string {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.background}"/><stop offset="1" stop-color="${palette.backgroundEnd}"/></linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${palette.primary}"/><stop offset="1" stop-color="${palette.secondary}"/></linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${palette.grid}" stroke-width="1"/></pattern>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="frame"><rect x="1" y="1" width="1198" height="358" rx="18"/></clipPath>
  </defs>`;
}

function toneColor(tone: Tone, palette: Palette): string {
  return tone === "primary" ? palette.primary : palette.secondary;
}

function shorten(value: string, maximumLength: number): string {
  return value.length <= maximumLength
    ? value
    : `${value.slice(0, maximumLength - 1).trimEnd()}…`;
}

function headlineLines(value: string): readonly [string, string] {
  const normalized = value.trim().replace(/\s+/g, " ");
  const midpoint = Math.floor(normalized.length / 2);
  const candidates = [...normalized.matchAll(/ /g)].map((match) => match.index);
  const splitAt =
    candidates.length > 0
      ? candidates.reduce((best, current) =>
          Math.abs(current - midpoint) < Math.abs(best - midpoint)
            ? current
            : best,
        )
      : Math.min(24, normalized.length);
  return [
    normalized.slice(0, splitAt).trim(),
    normalized.slice(splitAt).trim(),
  ];
}

function heroLayers(config: ProfileConfig, palette: Palette): string {
  const count = config.layers.length;
  const gap = 12;
  const available = 1156;
  const boxWidth = (available - gap * (count - 1)) / count;
  return config.layers
    .map((layer, index) => {
      const x = 22 + index * (boxWidth + gap);
      const color = toneColor(layer.tone, palette);
      const project = shorten(layer.project, 16);
      return `<g transform="translate(${x.toFixed(1)} 304)">
        <rect width="${boxWidth.toFixed(1)}" height="38" rx="5" fill="${palette.panel}" fill-opacity=".82" stroke="${color}" stroke-opacity=".65"/>
        <circle class="pulse" cx="14" cy="19" r="3" fill="${color}"/>
        <path d="M24 19h${Math.max(5, boxWidth - 34).toFixed(1)}" stroke="${color}" stroke-opacity=".18" stroke-dasharray="7 9"/>
        <text x="${(boxWidth / 2).toFixed(1)}" y="16" text-anchor="middle" font-size="8" letter-spacing="1.3" fill="${palette.muted}">${escapeXml(layer.name)}</text>
        <text x="${(boxWidth / 2).toFixed(1)}" y="29" text-anchor="middle" font-size="9" font-weight="700" fill="${color}">${escapeXml(project)}</text>
      </g>`;
    })
    .join("");
}

export class ControlPlaneRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createPalette(config, mode);
    const [headlineOne, headlineTwo] = headlineLines(config.identity.headline);
    const lineOne = escapeXml(headlineOne);
    const lineTwo = escapeXml(headlineTwo);
    const longestLine = Math.max(headlineOne.length, headlineTwo.length);
    const headlineSize = longestLine > 24 ? 34 : longestLine > 19 ? 42 : 52;
    const location = config.identity.location
      ? ` · ${escapeXml(config.identity.location)}`
      : "";
    const secondLine = lineTwo
      ? `<text x="38" y="218" font-size="${Math.max(31, headlineSize - 7)}" font-weight="900" letter-spacing="-1.5" fill="${palette.text}">${lineTwo}</text>`
      : "";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="360" viewBox="0 0 ${WIDTH} 360" role="img" aria-label="${escapeXml(config.identity.name)} profile control plane" data-mode="${mode}">
      ${definitions(palette)}${commonStyle(palette)}
      <g clip-path="url(#frame)"><rect width="1200" height="360" fill="url(#bg)"/><rect width="1200" height="360" fill="url(#grid)" opacity=".7"/>
      <path d="M0 292C240 250 360 176 566 84S930 20 1200 0V360H0Z" fill="${palette.primary}" opacity=".035"/>
      <path d="M660 0l290 360h250V0Z" fill="${palette.secondary}" opacity=".04"/>
      <path d="M0 1h1200" stroke="url(#accent)" stroke-width="2"/>
      <g transform="translate(22 22)"><circle cx="0" cy="0" r="4" fill="#EF4B5A"/><circle cx="18" cy="0" r="4" fill="#E6A425"/><circle cx="36" cy="0" r="4" fill="#22A447"/>
      <text x="58" y="4" class="micro" fill="${palette.muted}">${escapeXml(config.identity.name.toUpperCase())} / CONTROL_PLANE</text></g>
      <g transform="translate(1046 22)"><circle class="blink" cx="0" cy="0" r="4" fill="${palette.primary}" filter="url(#glow)"/><text x="14" y="4" class="micro" fill="${palette.muted}">SYSTEM ONLINE</text></g>
      <path d="M0 44h1200" stroke="${palette.line}"/>
      <text x="38" y="91" class="label" fill="${palette.primary}">// BUILDING THE INFRASTRUCTURE LAYER</text>
      <text x="38" y="159" font-size="${headlineSize}" font-weight="900" letter-spacing="-2" fill="${palette.text}">${lineOne}</text>${secondLine}
      <text x="40" y="252" font-size="13" letter-spacing="2" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline.toUpperCase(), 72))}${location}</text>
      <g transform="translate(1018 151)"><circle r="74" fill="none" stroke="${palette.line}"/><circle class="orbit" r="57" fill="none" stroke="${palette.primary}" stroke-width="1.5" stroke-dasharray="8 10" opacity=".65"/>
      <g stroke="${palette.primary}" opacity=".6"><path d="M0-74V-25M64-37L22-13M64 37L22 13M0 74V25M-64 37L-22 13M-64-37L-22-13"/></g>
      <circle r="18" fill="${palette.panel}" stroke="${palette.primary}" filter="url(#glow)"/><circle class="pulse" r="5" fill="${palette.primary}"/>
      <g fill="${palette.panel}" stroke="${palette.primary}"><circle cy="-74" r="6"/><circle cx="64" cy="-37" r="6"/><circle cx="64" cy="37" r="6"/><circle cy="74" r="6"/><circle cx="-64" cy="37" r="6"/><circle cx="-64" cy="-37" r="6"/></g></g>
      <text x="973" y="247" class="micro" fill="${palette.muted}">CLOSED LOOP</text>
      <text x="22" y="288" class="micro" fill="${palette.secondary}">EXECUTION PATH / ${String(config.layers.length).padStart(2, "0")} ACTIVE LAYERS</text>
      ${heroLayers(config, palette)}</g>
      <rect x="1" y="1" width="1198" height="358" rx="18" fill="none" stroke="${palette.primary}" stroke-opacity=".72"/>
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createPalette(config, mode);
    const count = config.layers.length;
    const centerX = 600;
    const centerY = 164;
    const radiusX = 430;
    const radiusY = 104;
    const points = config.layers.map((layer, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
      return {
        layer,
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      };
    });
    const path = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
      )
      .join("");
    const nodes = points
      .map(({ layer, x, y }, index) => {
        const color = toneColor(layer.tone, palette);
        const labelY = y < centerY ? y - 18 : y + 30;
        return `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15" fill="${palette.panel}" stroke="${color}" stroke-width="2"/><circle class="pulse" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${color}"/>
        <text x="${x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="${palette.text}">${escapeXml(layer.name)}</text>
        <text x="${x.toFixed(1)}" y="${(labelY + 12).toFixed(1)}" text-anchor="middle" font-size="8" fill="${palette.muted}">${escapeXml(shorten(layer.project, 25))}</text>
        <text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle" font-size="8" fill="${color}">${String(index + 1).padStart(2, "0")}</text></g>`;
      })
      .join("");

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="330" viewBox="0 0 ${WIDTH} 330" role="img" aria-label="${escapeXml(config.identity.name)} closed loop architecture" data-mode="${mode}">
      ${definitions(palette)}${commonStyle(palette)}<rect width="1200" height="330" rx="18" fill="url(#bg)"/><rect width="1200" height="330" rx="18" fill="url(#grid)" opacity=".7"/>
      <text x="28" y="34" class="label" fill="${palette.primary}">CLOSED LOOP / ARCHITECTURE MAP</text><text x="1170" y="34" text-anchor="end" class="micro" fill="${palette.muted}">${String(count).padStart(2, "0")} NODES · ONE SYSTEM</text>
      <path d="${path}Z" fill="none" stroke="${palette.line}" stroke-width="2"/><path class="flow" d="${path}Z" fill="none" stroke="url(#accent)" stroke-width="2"/>
      <g transform="translate(${centerX} ${centerY})"><circle r="62" fill="${palette.panel}" stroke="${palette.line}"/><circle class="orbit" r="48" fill="none" stroke="url(#accent)" stroke-width="2" stroke-dasharray="5 8"/>
      <circle r="23" fill="${palette.background}" stroke="${palette.primary}" filter="url(#glow)"/><circle class="pulse" r="6" fill="${palette.primary}"/>
      <text y="84" text-anchor="middle" class="micro" fill="${palette.muted}">${escapeXml(config.identity.headline)}</text></g>${nodes}
      <rect x="1" y="1" width="1198" height="328" rx="18" fill="none" stroke="${palette.secondary}" stroke-opacity=".55"/>
    </svg>`;
  }
}
