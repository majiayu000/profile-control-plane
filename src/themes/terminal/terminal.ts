import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
} from "../../core/types.js";
import { shorten, toneColor } from "../shared.js";

const WIDTH = 1200;
const BODY_X = 46;
const NBSP = "\u00A0";
const TEE = `├──${NBSP}`;
const ELBOW = `└──${NBSP}`;
const PIPE = `│${NBSP}${NBSP}${NBSP}`;
const GAP = NBSP.repeat(4);

interface TerminalPalette {
  readonly background: string;
  readonly panel: string;
  readonly chrome: string;
  readonly border: string;
  readonly text: string;
  readonly muted: string;
  readonly faint: string;
  readonly primary: string;
  readonly secondary: string;
}

function createTerminalPalette(
  config: ProfileConfig,
  mode: ColorMode,
): TerminalPalette {
  return mode === "dark"
    ? {
        background: "#0B0F0C",
        panel: "#101511",
        chrome: "#1A211B",
        border: "#2A342B",
        text: "#D7E4D9",
        muted: "#8CA08E",
        faint: "#59695B",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      }
    : {
        background: "#F4F6F4",
        panel: "#FFFFFF",
        chrome: "#E8EDE8",
        border: "#C8D2C8",
        text: "#1F2B21",
        muted: "#5E6E60",
        faint: "#96A497",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      };
}

function terminalStyle(): string {
  return `<style>
    text{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace}
    .ln{animation:reveal .45s ease-out backwards}
    .cur{animation:blink 1.1s steps(1) infinite}
    @keyframes reveal{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
    @keyframes blink{50%{opacity:0}}
    @media(prefers-reduced-motion:reduce){.ln{opacity:1;animation:none}.cur{animation:none}}
  </style>`;
}

function windowFrame(
  config: ProfileConfig,
  palette: TerminalPalette,
  height: number,
  path: string,
): string {
  const title = escapeXml(`${config.github.username}@github: ${path}`);
  return `<rect width="${WIDTH}" height="${height}" fill="${palette.background}"/>
    <rect x="14" y="14" width="1172" height="${height - 28}" rx="10" fill="${palette.panel}" stroke="${palette.border}"/>
    <path d="M14 48V24a10 10 0 0 1 10-10h1152a10 10 0 0 1 10 10v24Z" fill="${palette.chrome}"/>
    <path d="M14 48h1172" stroke="${palette.border}"/>
    <circle cx="38" cy="31" r="5.5" fill="#FF5F57"/><circle cx="57" cy="31" r="5.5" fill="#FEBC2E"/><circle cx="76" cy="31" r="5.5" fill="#28C840"/>
    <text x="600" y="35" text-anchor="middle" font-size="11" letter-spacing=".5" fill="${palette.muted}">${title}</text>`;
}

function promptLine(
  y: number,
  command: string,
  palette: TerminalPalette,
  fontSize = 13,
): string {
  return `<text x="${BODY_X}" y="${y}" font-size="${fontSize}"><tspan fill="${palette.primary}" font-weight="700">$${NBSP}</tspan><tspan fill="${palette.text}">${command}</tspan></text>`;
}

function cursorLine(y: number, palette: TerminalPalette): string {
  return `<text x="${BODY_X}" y="${y}" font-size="13" fill="${palette.primary}" font-weight="700">$</text>
    <rect class="cur" x="${BODY_X + 15}" y="${y - 12}" width="8" height="15" fill="${palette.primary}"/>`;
}

class LineBuilder {
  private readonly lines: string[] = [];
  private step = 0;
  constructor(
    public y: number,
    private readonly delayStep: number,
  ) {}

  push(markup: string, advance: number): void {
    this.lines.push(
      `<g class="ln" style="animation-delay:${this.step * this.delayStep}ms">${markup}</g>`,
    );
    this.step += 1;
    this.y += advance;
  }

  join(): string {
    return this.lines.join("");
  }
}

function flagshipRows(
  config: ProfileConfig,
  palette: TerminalPalette,
  builder: LineBuilder,
): void {
  const flagships = config.flagships.slice(0, 6);
  for (let row = 0; row * 3 < flagships.length; row += 1) {
    const cells = flagships
      .slice(row * 3, row * 3 + 3)
      .map((project, column) => {
        const color = toneColor(project.tone, palette);
        return `<text x="${BODY_X + column * 372}" y="${builder.y}" font-size="13" font-weight="700" fill="${color}">${escapeXml(shorten(project.repo, 28))}</text>`;
      })
      .join("");
    builder.push(cells, 21);
  }
}

function heroBody(config: ProfileConfig, palette: TerminalPalette): string {
  const builder = new LineBuilder(74, 130);
  builder.push(promptLine(builder.y, "whoami", palette), 22);
  builder.push(
    `<text x="${BODY_X}" y="${builder.y}" font-size="14" font-weight="700" fill="${palette.text}">${escapeXml(shorten(config.identity.name, 40))}</text>`,
    34,
  );
  builder.push(
    `<text x="${BODY_X}" y="${builder.y}" font-size="27" font-weight="800" letter-spacing="-.5" fill="${palette.text}">${escapeXml(shorten(config.identity.headline, 52))}</text>`,
    30,
  );
  if (config.identity.location) {
    builder.push(promptLine(builder.y, "pwd", palette), 20);
    builder.push(
      `<text x="${BODY_X}" y="${builder.y}" font-size="13" fill="${palette.secondary}">~/${escapeXml(shorten(config.identity.location, 36))}</text>`,
      26,
    );
  }
  builder.push(promptLine(builder.y, "cat tagline", palette), 20);
  builder.push(
    `<text x="${BODY_X}" y="${builder.y}" font-size="13" font-style="italic" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 88))}</text>`,
    26,
  );
  builder.push(promptLine(builder.y, "ls flagships/", palette), 22);
  flagshipRows(config, palette, builder);
  builder.push(cursorLine(builder.y, palette), 0);
  return builder.join();
}

function treeRows(
  config: ProfileConfig,
  palette: TerminalPalette,
  builder: LineBuilder,
  fontSize: number,
  lineHeight: number,
  twoLine: boolean,
): void {
  const layers = config.layers.slice(0, 12);
  layers.forEach((layer, index) => {
    const last = index === layers.length - 1;
    const branch = last ? ELBOW : TEE;
    const name = escapeXml(shorten(layer.name, 24));
    const color = toneColor(layer.tone, palette);
    const project = escapeXml(shorten(layer.project, 26));
    const summary = escapeXml(shorten(layer.description, twoLine ? 52 : 42));
    if (twoLine) {
      builder.push(
        `<text x="${BODY_X}" y="${builder.y}" font-size="${fontSize}"><tspan fill="${palette.faint}">${branch}</tspan><tspan fill="${palette.secondary}" font-weight="700">${name}/</tspan></text>`,
        lineHeight,
      );
      builder.push(
        `<text x="${BODY_X}" y="${builder.y}" font-size="${fontSize}"><tspan fill="${palette.faint}">${last ? GAP : PIPE}${ELBOW}</tspan><tspan fill="${color}" font-weight="700">${project}</tspan><tspan fill="${palette.muted}">${NBSP}·${NBSP}${summary}</tspan></text>`,
        lineHeight,
      );
    } else {
      builder.push(
        `<text x="${BODY_X}" y="${builder.y}" font-size="${fontSize}"><tspan fill="${palette.faint}">${branch}</tspan><tspan fill="${palette.secondary}" font-weight="700">${name}/</tspan><tspan fill="${palette.faint}">${NBSP}→${NBSP}</tspan><tspan fill="${color}" font-weight="700">${project}</tspan><tspan fill="${palette.muted}">${NBSP}·${NBSP}${summary}</tspan></text>`,
        lineHeight,
      );
    }
  });
}

function loopBody(config: ProfileConfig, palette: TerminalPalette): string {
  const count = Math.min(config.layers.length, 12);
  const twoLine = count <= 6;
  const totalRows = 4 + count * (twoLine ? 2 : 1);
  const lineHeight = Math.min(24, Math.floor(240 / Math.max(totalRows, 1)));
  const fontSize = lineHeight >= 20 ? 13 : lineHeight >= 16 ? 12 : 11;
  const builder = new LineBuilder(72, 90);
  builder.push(
    promptLine(builder.y, "tree layers/", palette, fontSize),
    lineHeight,
  );
  builder.push(
    `<text x="${BODY_X}" y="${builder.y}" font-size="${fontSize}" font-weight="700" fill="${palette.secondary}">layers/</text>`,
    lineHeight,
  );
  treeRows(config, palette, builder, fontSize, lineHeight, twoLine);
  builder.push(
    `<text x="${BODY_X}" y="${builder.y}" font-size="${fontSize}" fill="${palette.muted}">${count} directories, ${count} projects</text>`,
    lineHeight,
  );
  builder.push(cursorLine(builder.y, palette), 0);
  return builder.join();
}

export class TerminalRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createTerminalPalette(config, mode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="360" viewBox="0 0 ${WIDTH} 360" role="img" aria-label="${escapeXml(config.identity.name)} terminal profile" data-mode="${mode}">
      ${terminalStyle()}${windowFrame(config, palette, 360, "~")}
      ${heroBody(config, palette)}
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createTerminalPalette(config, mode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="330" viewBox="0 0 ${WIDTH} 330" role="img" aria-label="${escapeXml(config.identity.name)} layer tree" data-mode="${mode}">
      ${terminalStyle()}${windowFrame(config, palette, 330, "~/layers")}
      ${loopBody(config, palette)}
    </svg>`;
  }
}
