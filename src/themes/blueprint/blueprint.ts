import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
} from "../../core/types.js";
import { shorten, toneColor } from "../shared.js";

interface BlueprintPalette {
  readonly backgroundTop: string;
  readonly backgroundBottom: string;
  readonly line: string;
  readonly ink: string;
  readonly muted: string;
  readonly grid: string;
  readonly fill: string;
  readonly primary: string;
  readonly secondary: string;
}

function createBlueprintPalette(
  config: ProfileConfig,
  mode: ColorMode,
): BlueprintPalette {
  return mode === "dark"
    ? {
        backgroundTop: "#0A2A4A",
        backgroundBottom: "#0D3358",
        line: "#E8F1F8",
        ink: "#E8F1F8",
        muted: "#9FB8CC",
        grid: "#FFFFFF",
        fill: "#0F3A63",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      }
    : {
        backgroundTop: "#F7F9FB",
        backgroundBottom: "#EFF3F7",
        line: "#1F4E79",
        ink: "#1F4E79",
        muted: "#54749B",
        grid: "#1F4E79",
        fill: "#E7EEF5",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      };
}

function blueprintStyle(): string {
  return `<style>
    .mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
    .cline{stroke-dasharray:14 4 2 4;animation:cdrift 14s linear infinite}
    @keyframes cdrift{to{stroke-dashoffset:-96}}
    @media(prefers-reduced-motion:reduce){.cline{animation:none}}
  </style>`;
}

function blueprintDefs(palette: BlueprintPalette): string {
  return `<defs>
    <linearGradient id="bp-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.backgroundTop}"/><stop offset="1" stop-color="${palette.backgroundBottom}"/></linearGradient>
    <pattern id="bp-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${palette.grid}" stroke-opacity=".08"/></pattern>
    <pattern id="bp-grid-major" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="${palette.grid}" stroke-opacity=".14"/></pattern>
    <marker id="bp-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill="${palette.line}"/></marker>
  </defs>`;
}

function frame(
  width: number,
  height: number,
  palette: BlueprintPalette,
): string {
  const innerW = width - 32;
  const innerH = height - 32;
  return `<rect width="${width}" height="${height}" fill="url(#bp-bg)"/>
    <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="${palette.line}" stroke-width="1.5"/>
    <rect x="16" y="16" width="${innerW}" height="${innerH}" fill="url(#bp-grid)" stroke="${palette.line}" stroke-width=".5"/>
    <rect x="16" y="16" width="${innerW}" height="${innerH}" fill="url(#bp-grid-major)"/>`;
}

function titleBlock(config: ProfileConfig, palette: BlueprintPalette): string {
  const rows: readonly (readonly [string, string])[] = [
    ["DRAWN BY", shorten(config.identity.name, 24).toUpperCase()],
    ["PROJECT", shorten(config.identity.headline, 30).toUpperCase()],
    ...(config.identity.location
      ? ([
          ["LOCATION", shorten(config.identity.location, 24).toUpperCase()],
        ] as const)
      : []),
    ["SHEET", "01 OF 01"],
    ["REV", String(config.layers.length).padStart(2, "0")],
    ["SCALE", "NTS"],
  ];
  const rowHeight = 21;
  const width = 330;
  const height = rows.length * rowHeight;
  const x = 1184 - width;
  const y = 344 - height;
  const cells = rows
    .map(([label, value], index) => {
      const rowY = y + index * rowHeight;
      return `<path d="M${x} ${rowY}H${x + width}" stroke="${palette.line}" stroke-width=".6"/>
      <text x="${x + 10}" y="${rowY + 14}" class="mono" font-size="8" letter-spacing="1.5" fill="${palette.muted}">${escapeXml(label)}</text>
      <text x="${x + 108}" y="${rowY + 14}" class="mono" font-size="9.5" fill="${palette.ink}">${escapeXml(value)}</text>`;
    })
    .join("");
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${palette.fill}" stroke="${palette.line}" stroke-width="1.2"/>
    <path d="M${x + 100} ${y}V${344}" stroke="${palette.line}" stroke-width=".6"/>${cells}`;
}

function partCell(
  index: number,
  repo: string,
  tone: "primary" | "secondary",
  palette: BlueprintPalette,
): string {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const x = 56 + column * 252;
  const y = 102 + row * 118;
  const partW = 168;
  const partH = 58;
  const accent = toneColor(tone, palette);
  const cx = x + partW / 2;
  const cy = y + partH / 2;
  const dimY = y + partH + 16;
  return `<g>
    <path class="cline" d="M${x - 18} ${cy}H${x + partW + 18}" stroke="${palette.line}" stroke-opacity=".55" stroke-width=".8"/>
    <rect x="${x}" y="${y}" width="${partW}" height="${partH}" fill="${palette.fill}" fill-opacity=".55" stroke="${palette.line}" stroke-width="1.2"/>
    <path d="M${x + 8} ${y + partH - 8}L${x + 24} ${y + partH - 24}M${x + 8} ${y + partH - 20}L${x + 20} ${y + partH - 32}" stroke="${palette.line}" stroke-opacity=".4" stroke-width=".7"/>
    <circle cx="${cx}" cy="${cy}" r="2.4" fill="none" stroke="${palette.line}" stroke-width=".8"/>
    <circle cx="${x - 4}" cy="${y - 4}" r="12" fill="${palette.backgroundTop}" stroke="${accent}" stroke-width="1.6"/>
    <text x="${x - 4}" y="${y - 1}" text-anchor="middle" class="mono" font-size="9" font-weight="700" fill="${palette.ink}">${String(index + 1).padStart(2, "0")}</text>
    <path d="M${x} ${dimY}H${x + partW}" stroke="${palette.line}" stroke-width=".8" marker-start="url(#bp-arr)" marker-end="url(#bp-arr)"/>
    <path d="M${x} ${dimY - 5}V${dimY + 5}M${x + partW} ${dimY - 5}V${dimY + 5}" stroke="${palette.line}" stroke-width=".6"/>
    <text x="${cx}" y="${dimY + 14}" text-anchor="middle" class="mono" font-size="9" fill="${palette.ink}">${escapeXml(shorten(repo, 24))}</text>
  </g>`;
}

function partsList(config: ProfileConfig, palette: BlueprintPalette): string {
  const layers = config.layers.slice(0, 12);
  const tableX = 640;
  const tableW = 520;
  const tableTop = 72;
  const rowHeight = Math.min(24, Math.floor(228 / Math.max(layers.length, 1)));
  const rows = layers
    .map((layer, index) => {
      const rowY = tableTop + 22 + index * rowHeight;
      const spec = `${shorten(layer.project, 22)} — ${shorten(layer.description, 30)}`;
      return `<path d="M${tableX} ${rowY}H${tableX + tableW}" stroke="${palette.line}" stroke-width=".5" stroke-opacity=".7"/>
      <text x="${tableX + 10}" y="${rowY + rowHeight - 6}" class="mono" font-size="9" font-weight="700" fill="${toneColor(layer.tone, palette)}">${String(index + 1).padStart(2, "0")}</text>
      <text x="${tableX + 48}" y="${rowY + rowHeight - 6}" class="mono" font-size="9" fill="${palette.ink}">${escapeXml(shorten(layer.name, 18))}</text>
      <text x="${tableX + 210}" y="${rowY + rowHeight - 6}" class="mono" font-size="8.5" fill="${palette.muted}">${escapeXml(spec)}</text>`;
    })
    .join("");
  const tableH = 22 + layers.length * rowHeight;
  return `<rect x="${tableX}" y="${tableTop}" width="${tableW}" height="${tableH}" fill="${palette.fill}" fill-opacity=".5" stroke="${palette.line}" stroke-width="1.2"/>
    <text x="${tableX + 10}" y="${tableTop + 15}" class="mono" font-size="8" letter-spacing="2" fill="${palette.ink}">NO.</text>
    <text x="${tableX + 48}" y="${tableTop + 15}" class="mono" font-size="8" letter-spacing="2" fill="${palette.ink}">PART</text>
    <text x="${tableX + 210}" y="${tableTop + 15}" class="mono" font-size="8" letter-spacing="2" fill="${palette.ink}">SPEC</text>
    <path d="M${tableX + 40} ${tableTop}V${tableTop + tableH}M${tableX + 202} ${tableTop}V${tableTop + tableH}" stroke="${palette.line}" stroke-width=".5"/>${rows}`;
}

function explodedParts(
  config: ProfileConfig,
  palette: BlueprintPalette,
): string {
  const layers = config.layers.slice(0, 12);
  const count = Math.max(layers.length, 1);
  const axisX0 = 70;
  const axisX1 = 590;
  const step = (axisX1 - axisX0) / (count + 1);
  const tableTop = 72;
  const rowHeight = Math.min(24, Math.floor(228 / count));
  return layers
    .map((layer, index) => {
      const cx = axisX0 + step * (index + 1);
      const cy = 165 + (index % 2 === 0 ? -34 : 34);
      const accent = toneColor(layer.tone, palette);
      const shape =
        index % 2 === 0
          ? `<rect x="${cx - 16}" y="${cy - 13}" width="32" height="26" fill="${palette.fill}" fill-opacity=".6" stroke="${accent}" stroke-width="1.4"/>`
          : `<circle cx="${cx}" cy="${cy}" r="15" fill="${palette.fill}" fill-opacity=".6" stroke="${accent}" stroke-width="1.4"/>`;
      const rowY = tableTop + 22 + index * rowHeight + rowHeight / 2;
      const elbowX = 606 + (index % 3) * 9;
      return `<g>
        <path d="M${cx} 165V${cy}" stroke="${palette.line}" stroke-width=".7" stroke-dasharray="3 3"/>
        ${shape}
        <text x="${cx}" y="${cy + (index % 2 === 0 ? -20 : 28)}" text-anchor="middle" class="mono" font-size="8.5" font-weight="700" fill="${palette.ink}">${String(index + 1).padStart(2, "0")}</text>
        <path d="M${cx + 18} ${cy}L${elbowX} ${cy}L${elbowX + 22} ${rowY}L640 ${rowY}" fill="none" stroke="${palette.line}" stroke-width=".6" stroke-opacity=".65"/>
        <circle cx="${cx + 18}" cy="${cy}" r="1.6" fill="${palette.line}"/>
      </g>`;
    })
    .join("");
}

export class BlueprintRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createBlueprintPalette(config, mode);
    const parts = config.flagships
      .slice(0, 6)
      .map((project, index) =>
        partCell(index, project.repo, project.tone, palette),
      )
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} engineering drawing" data-mode="${mode}">
      ${blueprintDefs(palette)}${blueprintStyle()}${frame(1200, 360, palette)}
      <text x="40" y="48" class="mono" font-size="14" font-weight="700" letter-spacing="3" fill="${palette.ink}">${escapeXml(shorten(config.identity.name, 32).toUpperCase())} — GENERAL ARRANGEMENT</text>
      <text x="40" y="66" class="mono" font-size="9" letter-spacing="1.5" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 88))}</text>
      <path d="M40 76H600" stroke="${palette.line}" stroke-width=".7"/>
      <text x="1160" y="48" text-anchor="end" class="mono" font-size="9" letter-spacing="2" fill="${palette.muted}">DWG NO. ${escapeXml(shorten(config.github.username, 20).toUpperCase())}-001</text>
      ${parts}${titleBlock(config, palette)}
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createBlueprintPalette(config, mode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} assembly drawing" data-mode="${mode}">
      ${blueprintDefs(palette)}${blueprintStyle()}${frame(1200, 330, palette)}
      <text x="40" y="46" class="mono" font-size="12" font-weight="700" letter-spacing="3" fill="${palette.ink}">EXPLODED ASSEMBLY — ${String(config.layers.length).padStart(2, "0")} PARTS</text>
      <text x="40" y="62" class="mono" font-size="8.5" letter-spacing="1.5" fill="${palette.muted}">${escapeXml(shorten(config.identity.headline, 64).toUpperCase())}</text>
      <path class="cline" d="M50 165H610" stroke="${palette.line}" stroke-opacity=".55" stroke-width=".9"/>
      <path d="M610 165H618" stroke="${palette.line}" stroke-width=".9" marker-end="url(#bp-arr)"/>
      ${explodedParts(config, palette)}${partsList(config, palette)}
      <text x="40" y="306" class="mono" font-size="8" letter-spacing="2" fill="${palette.muted}">ALL DIMENSIONS NOMINAL · DO NOT SCALE DRAWING</text>
    </svg>`;
  }
}
