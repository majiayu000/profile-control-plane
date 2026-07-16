import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ModuleGroup,
  ProfileConfig,
  ThemeRenderer,
} from "../../core/types.js";
import { shorten } from "../shared.js";

interface MetroPalette {
  readonly background: string;
  readonly ink: string;
  readonly muted: string;
  readonly panel: string;
  readonly panelInk: string;
  readonly stationFill: string;
  readonly stationRing: string;
  readonly rule: string;
  readonly primary: string;
  readonly secondary: string;
}

function createMetroPalette(
  config: ProfileConfig,
  mode: ColorMode,
): MetroPalette {
  return mode === "dark"
    ? {
        background: "#0E1420",
        ink: "#F2F5FA",
        muted: "#7C8698",
        panel: "#1A2232",
        panelInk: "#F2F5FA",
        stationFill: "#0E1420",
        stationRing: "#F2F5FA",
        rule: "#2A3446",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      }
    : {
        background: "#FAFAF8",
        ink: "#2B2B2B",
        muted: "#8A8A85",
        panel: "#22262B",
        panelInk: "#FAFAF8",
        stationFill: "#FFFFFF",
        stationRing: "#2B2B2B",
        rule: "#DEDED8",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      };
}

function metroStyle(): string {
  return `<style>
    .sans{font-family:Helvetica,Arial,sans-serif}
    .flow{stroke-dasharray:4 22;animation:flow 14s linear infinite}
    @keyframes flow{to{stroke-dashoffset:-260}}
    @media(prefers-reduced-motion:reduce){.flow{animation:none}}
  </style>`;
}

function hexChannel(hex: string, index: number): number {
  const clean = hex.replace("#", "");
  const wide =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const value = Number.parseInt(wide.slice(index * 2, index * 2 + 2), 16);
  return Number.isNaN(value) ? 128 : value;
}

function mixHex(a: string, b: string, t: number): string {
  const channels = [0, 1, 2].map((i) => {
    const mixed = Math.round(hexChannel(a, i) * (1 - t) + hexChannel(b, i) * t);
    return Math.min(255, Math.max(0, mixed)).toString(16).padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

function lineColors(
  primary: string,
  secondary: string,
  count: number,
): readonly string[] {
  const total = Math.min(Math.max(count, 1), 5);
  if (total === 1) return [primary];
  return Array.from({ length: total }, (_, i) =>
    mixHex(primary, secondary, i / (total - 1)),
  );
}

interface StationSlot {
  readonly x: number;
  readonly y: number;
  readonly line: number;
}

const HERO_LINE_PATHS: readonly string[] = [
  "M40 236H240L300 176H760L830 246H1094",
  "M40 296H420L500 216H972",
  "M40 186H140L220 266H600L670 196H1094",
];

const HERO_FLAGSHIP_SLOTS: readonly StationSlot[] = [
  { x: 380, y: 176, line: 0 },
  { x: 620, y: 216, line: 1 },
  { x: 940, y: 246, line: 0 },
  { x: 300, y: 266, line: 2 },
  { x: 800, y: 196, line: 2 },
  { x: 200, y: 296, line: 1 },
];

const HERO_MINOR_SLOTS: readonly StationSlot[] = [
  { x: 150, y: 236, line: 0 },
  { x: 520, y: 176, line: 0 },
  { x: 320, y: 296, line: 1 },
  { x: 780, y: 216, line: 1 },
  { x: 90, y: 186, line: 2 },
  { x: 450, y: 266, line: 2 },
  { x: 660, y: 176, line: 0 },
  { x: 560, y: 266, line: 2 },
  { x: 960, y: 196, line: 2 },
];

function heroBanner(config: ProfileConfig, palette: MetroPalette): string {
  const name = escapeXml(shorten(config.identity.name, 26));
  const headline = escapeXml(shorten(config.identity.headline, 60));
  const layerCount = String(config.layers.length).padStart(2, "0");
  return `<g class="sans">
    <rect x="40" y="26" width="1120" height="96" rx="14" fill="${palette.panel}"/>
    <rect x="40" y="26" width="1120" height="96" rx="14" fill="none" stroke="${palette.rule}"/>
    <circle cx="106" cy="74" r="30" fill="${palette.primary}"/>
    <circle cx="106" cy="74" r="30" fill="none" stroke="${palette.panelInk}" stroke-width="3"/>
    <text x="106" y="83" text-anchor="middle" font-size="26" font-weight="900" fill="${palette.panelInk}">${layerCount}</text>
    <text x="162" y="70" font-size="40" font-weight="900" letter-spacing="1" fill="${palette.panelInk}">${name}</text>
    <text x="162" y="102" font-size="15" letter-spacing="2" fill="${palette.panelInk}" opacity=".75">${headline.toUpperCase()}</text>
    <text x="1132" y="102" text-anchor="end" font-size="10" letter-spacing="2" fill="${palette.panelInk}" opacity=".6">METRO · ${escapeXml(shorten(config.github.username, 20).toUpperCase())}</text>
  </g>`;
}

function heroLines(palette: MetroPalette, colors: readonly string[]): string {
  const paths = HERO_LINE_PATHS.map(
    (d, i) =>
      `<path d="${d}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>`,
  ).join("");
  const flow = `<path class="flow" d="${HERO_LINE_PATHS[0]}" fill="none" stroke="${palette.stationFill}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  const arrowA = `<path d="M1094 236L1116 246L1094 256Z" fill="${colors[0]}"/>`;
  const arrowC = `<path d="M1094 186L1116 196L1094 206Z" fill="${colors[2 % colors.length]}"/>`;
  const terminus = `<rect x="972" y="207" width="18" height="18" rx="3" fill="${colors[1 % colors.length]}" stroke="${palette.stationRing}" stroke-width="2"/>`;
  return `${paths}${flow}${arrowA}${arrowC}${terminus}`;
}

function heroStations(
  config: ProfileConfig,
  palette: MetroPalette,
  colors: readonly string[],
): string {
  const flagships = config.flagships
    .slice(0, HERO_FLAGSHIP_SLOTS.length)
    .map((project, index) => {
      const slot = HERO_FLAGSHIP_SLOTS[index] as StationSlot;
      const label = escapeXml(shorten(project.repo, 18));
      return `<g class="sans">
        <circle cx="${slot.x}" cy="${slot.y}" r="9" fill="${palette.stationFill}" stroke="${palette.stationRing}" stroke-width="3.5"/>
        <text transform="translate(${(slot.x + 7).toFixed(1)} ${(slot.y - 13).toFixed(1)}) rotate(-45)" font-size="11" font-weight="700" fill="${palette.ink}">${label}</text>
      </g>`;
    })
    .join("");
  const minors = config.layers
    .slice(0, HERO_MINOR_SLOTS.length)
    .map((_, index) => {
      const slot = HERO_MINOR_SLOTS[index] as StationSlot;
      return `<circle cx="${slot.x}" cy="${slot.y}" r="4.5" fill="${colors[slot.line % colors.length]}" stroke="${palette.background}" stroke-width="1.5"/>`;
    })
    .join("");
  return `${flagships}${minors}`;
}

function sharedRepoCounts(
  groups: readonly ModuleGroup[],
): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const group of groups) {
    for (const project of group.projects) {
      counts.set(project.repo, (counts.get(project.repo) ?? 0) + 1);
    }
  }
  return counts;
}

interface LoopRoute {
  readonly startY: number;
  readonly bendX: number;
  readonly levelY: number;
}

const LOOP_ROUTES: readonly LoopRoute[] = [
  { startY: 130, bendX: 130, levelY: 86 },
  { startY: 146, bendX: 170, levelY: 252 },
  { startY: 162, bendX: 300, levelY: 148 },
  { startY: 178, bendX: 240, levelY: 210 },
  { startY: 194, bendX: 350, levelY: 110 },
];

function loopRoutePath(route: LoopRoute): string {
  const rise = Math.abs(route.levelY - route.startY);
  const diagEndX = route.bendX + rise;
  return `M84 ${route.startY}H${route.bendX}L${diagEndX.toFixed(1)} ${route.levelY}H1150`;
}

function loopLine(
  group: ModuleGroup,
  index: number,
  color: string,
  palette: MetroPalette,
  shared: ReadonlyMap<string, number>,
): string {
  const route = LOOP_ROUTES[index % LOOP_ROUTES.length] as LoopRoute;
  const projects = group.projects.slice(0, 8);
  const startX = 430 + index * 14;
  const spacing =
    projects.length > 1 ? (1060 - startX) / (projects.length - 1) : 0;
  const stations = projects
    .map((project, stationIndex) => {
      const x = startX + stationIndex * spacing;
      const isInterchange = (shared.get(project.repo) ?? 0) > 1;
      const ring = isInterchange
        ? `<circle cx="${x.toFixed(1)}" cy="${route.levelY}" r="6.5" fill="${palette.stationFill}" stroke="${palette.stationRing}" stroke-width="2.6"/>`
        : `<circle cx="${x.toFixed(1)}" cy="${route.levelY}" r="4.5" fill="${palette.stationFill}" stroke="${color}" stroke-width="2.2"/>`;
      return `${ring}<text transform="translate(${(x + 4).toFixed(1)} ${(route.levelY - 9).toFixed(1)}) rotate(-45)" class="sans" font-size="8" fill="${palette.ink}">${escapeXml(shorten(project.repo, 14))}</text>`;
    })
    .join("");
  return `<path d="${loopRoutePath(route)}" fill="none" stroke="${color}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>${stations}`;
}

function metroLegend(
  groups: readonly ModuleGroup[],
  colors: readonly string[],
  palette: MetroPalette,
): string {
  const rowHeight = 16;
  const height = 24 + groups.length * rowHeight;
  const y = 312 - height;
  const rows = groups
    .map((group, index) => {
      const rowY = y + 30 + index * rowHeight;
      return `<rect x="42" y="${rowY - 8}" width="18" height="6" rx="3" fill="${colors[index % colors.length]}"/>
      <text x="68" y="${rowY}" class="sans" font-size="9" font-weight="700" fill="${palette.ink}">${escapeXml(shorten(group.name, 20))}</text>
      <text x="252" y="${rowY}" text-anchor="end" class="sans" font-size="9" fill="${palette.muted}">${Math.min(group.projects.length, 8)} stn</text>`;
    })
    .join("");
  return `<g>
    <rect x="30" y="${y}" width="234" height="${height}" rx="6" fill="${palette.background}" stroke="${palette.rule}"/>
    <text x="42" y="${y + 16}" class="sans" font-size="8" font-weight="700" letter-spacing="2" fill="${palette.muted}">LINE DIRECTORY</text>
    ${rows}
  </g>`;
}

function loopDepot(palette: MetroPalette): string {
  return `<g class="sans">
    <rect x="38" y="116" width="46" height="92" rx="6" fill="${palette.panel}" stroke="${palette.rule}"/>
    <text transform="translate(66 190) rotate(-90)" font-size="9" letter-spacing="3" font-weight="700" fill="${palette.panelInk}">DEPOT</text>
  </g>`;
}

function loopEmpty(palette: MetroPalette): string {
  return `<g class="sans">
    <path d="M84 162H400L480 242H1150" fill="none" stroke="${palette.rule}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="620" cy="242" r="6" fill="${palette.stationFill}" stroke="${palette.muted}" stroke-width="2.4"/>
    <text x="600" y="140" font-size="14" font-weight="700" fill="${palette.muted}" text-anchor="middle">No lines in service</text>
  </g>`;
}

export class MetroRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createMetroPalette(config, mode);
    const colors = lineColors(palette.primary, palette.secondary, 3);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} metro map profile" data-mode="${mode}">
      ${metroStyle()}<rect width="1200" height="360" fill="${palette.background}"/>
      ${heroBanner(config, palette)}
      ${heroLines(palette, colors)}
      ${heroStations(config, palette, colors)}
      <text x="40" y="344" class="sans" font-size="10" letter-spacing="1" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 90))}</text>
      <text x="1160" y="344" text-anchor="end" class="sans" font-size="9" letter-spacing="2" fill="${palette.muted}">${String(config.flagships.length).padStart(2, "0")} INTERCHANGES</text>
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createMetroPalette(config, mode);
    const groups = config.module_groups.slice(0, 5);
    const colors = lineColors(
      palette.primary,
      palette.secondary,
      Math.max(groups.length, 1),
    );
    const shared = sharedRepoCounts(groups);
    const network =
      groups.length === 0
        ? loopEmpty(palette)
        : groups
            .map((group, index) =>
              loopLine(
                group,
                index,
                colors[index % colors.length] as string,
                palette,
                shared,
              ),
            )
            .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} network map" data-mode="${mode}">
      ${metroStyle()}<rect width="1200" height="330" fill="${palette.background}"/>
      <text x="1160" y="40" text-anchor="end" class="sans" font-size="16" font-weight="900" letter-spacing="4" fill="${palette.ink}">NETWORK MAP</text>
      <text x="1160" y="58" text-anchor="end" class="sans" font-size="9" letter-spacing="2" fill="${palette.muted}">${escapeXml(shorten(config.identity.name, 30).toUpperCase())} · ${groups.length} LINES</text>
      ${network}
      ${groups.length > 0 ? loopDepot(palette) : ""}
      ${groups.length > 0 ? metroLegend(groups, colors, palette) : ""}
    </svg>`;
  }
}
