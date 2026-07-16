import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
} from "../../core/types.js";
import { shorten, toneColor } from "../shared.js";

interface WorkbenchPalette {
  readonly background: string;
  readonly board: string;
  readonly module: string;
  readonly raised: string;
  readonly text: string;
  readonly muted: string;
  readonly trace: string;
  readonly shadow: string;
  readonly primary: string;
  readonly secondary: string;
}

function createWorkbenchPalette(
  config: ProfileConfig,
  mode: ColorMode,
): WorkbenchPalette {
  return mode === "dark"
    ? {
        background: "#080B0D",
        board: "#101619",
        module: "#182125",
        raised: "#202C31",
        text: "#EEF6F4",
        muted: "#8BA19F",
        trace: "#30494C",
        shadow: "#000000",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      }
    : {
        background: "#DCE2DE",
        board: "#EDF1EC",
        module: "#F8FAF5",
        raised: "#FFFFFF",
        text: "#142022",
        muted: "#627471",
        trace: "#B5C6C2",
        shadow: "#9AA8A4",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      };
}

function workbenchStyle(): string {
  return `<style>
    .display{font-family:"Arial Narrow","Avenir Next Condensed",Impact,sans-serif}.body{font-family:"Avenir Next",Avenir,Helvetica,sans-serif}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .boot{animation:boot .65s cubic-bezier(.2,.8,.2,1)}.signal{stroke-dasharray:4 8;animation:signal 7s linear infinite}.dial{transform-box:fill-box;transform-origin:center;animation:dial 14s linear infinite}
    @keyframes boot{from{opacity:.3;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}@keyframes signal{to{stroke-dashoffset:-120}}@keyframes dial{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.boot,.signal,.dial{animation:none}}
  </style>`;
}

function workbenchDefs(palette: WorkbenchPalette): string {
  return `<defs>
    <pattern id="perf" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.15" fill="${palette.trace}" opacity=".5"/></pattern>
    <linearGradient id="board-glow" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.board}"/><stop offset=".62" stop-color="${palette.board}"/><stop offset="1" stop-color="${palette.primary}" stop-opacity=".07"/></linearGradient>
    <filter id="module-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="5" stdDeviation="3" flood-color="${palette.shadow}" flood-opacity=".34"/></filter>
  </defs>`;
}

function cutCard(x: number, y: number, width: number, height: number): string {
  return `M${x} ${y}H${x + width - 18}L${x + width} ${y + 18}V${y + height}H${x}Z`;
}

function breakHeadline(value: string): readonly [string, string] {
  if (value.length <= 28) return [value, ""];
  const words = value.split(/\s+/);
  const split = Math.ceil(words.length / 2);
  return [words.slice(0, split).join(" "), words.slice(split).join(" ")];
}

function flagshipModules(
  config: ProfileConfig,
  palette: WorkbenchPalette,
): string {
  return config.flagships
    .slice(0, 3)
    .map((project, index) => {
      const y = 23 + index * 108;
      const accent = toneColor(project.tone, palette);
      return `<g class="boot" style="animation-delay:${100 + index * 75}ms" filter="url(#module-shadow)"><path d="${cutCard(724, y, 452, 91)}" fill="${palette.module}" stroke="${palette.trace}"/>
        <path d="M724 ${y + 7}H${724 + 6 + index * 56}" stroke="${accent}" stroke-width="4"/><circle cx="746" cy="${y + 44}" r="10" fill="none" stroke="${accent}"/><circle cx="746" cy="${y + 44}" r="3" fill="${accent}"/>
        <text x="773" y="${y + 31}" class="body" font-size="15" font-weight="800" fill="${palette.text}">${escapeXml(shorten(project.repo, 31))}</text><text x="773" y="${y + 52}" class="mono" font-size="8" letter-spacing="1.4" fill="${accent}">${escapeXml(shorten(project.role, 15).toUpperCase())} / PORT ${index + 1}</text>
        <text x="773" y="${y + 72}" class="body" font-size="10" fill="${palette.muted}">${escapeXml(shorten(project.description, 58))}</text><path d="M1149 ${y + 29}v35" stroke="${palette.trace}"/><circle cx="1149" cy="${y + 23}" r="3" fill="${accent}"/>
      </g>`;
    })
    .join("");
}

export class BentoGridRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createWorkbenchPalette(config, mode);
    const [lineOne, lineTwo] = breakHeadline(config.identity.headline);
    const headlineSize =
      Math.max(lineOne.length, lineTwo.length) > 24 ? 37 : 45;
    const location = config.identity.location
      ? escapeXml(shorten(config.identity.location, 18))
      : "REMOTE";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} modular workbench" data-mode="${mode}">
      ${workbenchDefs(palette)}${workbenchStyle()}<rect width="1200" height="360" fill="${palette.background}"/><rect x="10" y="10" width="1180" height="340" rx="12" fill="url(#board-glow)" stroke="${palette.trace}"/><rect x="10" y="10" width="1180" height="340" rx="12" fill="url(#perf)"/>
      <path d="M690 48H706V68H724M690 156H706V176H724M690 264H706V284H724" fill="none" stroke="${palette.trace}" stroke-width="2"/><path class="signal" d="M690 48H706V68H724M690 156H706V176H724M690 264H706V284H724" fill="none" stroke="${palette.primary}"/>
      <g class="boot" filter="url(#module-shadow)"><path d="${cutCard(24, 23, 666, 231)}" fill="${palette.module}" stroke="${palette.trace}"/><rect x="24" y="23" width="7" height="231" fill="${palette.primary}"/><text x="52" y="55" class="mono" font-size="8" letter-spacing="2" fill="${palette.primary}">IDENTITY MODULE / ${escapeXml(config.identity.name.toUpperCase())}</text>
      <text x="50" y="113" class="display" font-size="${headlineSize}" font-weight="900" letter-spacing="-.8" fill="${palette.text}">${escapeXml(lineOne)}</text>${lineTwo ? `<text x="50" y="${113 + headlineSize}" class="display" font-size="${headlineSize}" font-weight="900" letter-spacing="-.8" fill="${palette.text}">${escapeXml(lineTwo)}</text>` : ""}
      <text x="52" y="210" class="body" font-size="11" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 78))}</text><path d="M52 226H456" stroke="${palette.trace}"/><text x="52" y="242" class="mono" font-size="8" letter-spacing="1.4" fill="${palette.text}">OUTPUT / OPEN SOURCE SYSTEMS</text>
      <g transform="translate(620 80)"><circle r="35" fill="${palette.raised}" stroke="${palette.trace}"/><circle class="dial" r="25" fill="none" stroke="${palette.secondary}" stroke-width="4" stroke-dasharray="7 6"/><circle r="8" fill="${palette.secondary}"/><path d="M0-20V-31" stroke="${palette.text}" stroke-width="2"/></g></g>
      <g class="boot" style="animation-delay:80ms" filter="url(#module-shadow)"><path d="${cutCard(24, 271, 204, 66)}" fill="${palette.raised}" stroke="${palette.trace}"/><text x="43" y="294" class="mono" font-size="8" letter-spacing="1.6" fill="${palette.muted}">ACTIVE LAYERS</text><text x="43" y="322" class="display" font-size="23" font-weight="900" fill="${palette.primary}">${String(config.layers.length).padStart(2, "0")}</text><circle cx="204" cy="313" r="4" fill="${palette.primary}"/></g>
      <g class="boot" style="animation-delay:120ms" filter="url(#module-shadow)"><path d="${cutCard(239, 271, 214, 66)}" fill="${palette.raised}" stroke="${palette.trace}"/><text x="258" y="294" class="mono" font-size="8" letter-spacing="1.6" fill="${palette.muted}">SELECTED SYSTEMS</text><text x="258" y="322" class="display" font-size="23" font-weight="900" fill="${palette.secondary}">${String(config.flagships.length).padStart(2, "0")}</text><circle cx="428" cy="313" r="4" fill="${palette.secondary}"/></g>
      <g class="boot" style="animation-delay:160ms" filter="url(#module-shadow)"><path d="${cutCard(464, 271, 226, 66)}" fill="${palette.raised}" stroke="${palette.trace}"/><text x="483" y="294" class="mono" font-size="8" letter-spacing="1.6" fill="${palette.muted}">WORKSTATION</text><text x="483" y="320" class="mono" font-size="10" font-weight="700" fill="${palette.text}">${location.toUpperCase()}</text><path d="M650 297v20M642 307h16" stroke="${palette.primary}"/></g>
      ${flagshipModules(config, palette)}
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createWorkbenchPalette(config, mode);
    const points = config.layers.map((_, index) => {
      const row = Math.floor(index / 4);
      const column = index % 4;
      return { x: 302 + column * 218 + (row % 2) * 24, y: 72 + row * 87 };
    });
    const signalPath = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
      .join("");
    const modules = config.layers
      .map((layer, index) => {
        const point = points[index]!;
        const x = point.x - 92;
        const y = point.y - 29;
        const accent = toneColor(layer.tone, palette);
        return `<g class="boot" style="animation-delay:${index * 45}ms" filter="url(#module-shadow)"><path d="${cutCard(x, y, 184, 62)}" fill="${palette.module}" stroke="${palette.trace}"/><rect x="${x}" y="${y}" width="5" height="62" fill="${accent}"/>
          <text x="${x + 18}" y="${y + 22}" class="mono" font-size="7" letter-spacing="1.4" fill="${accent}">${String(index + 1).padStart(2, "0")} / ${escapeXml(shorten(layer.name, 16).toUpperCase())}</text><text x="${x + 18}" y="${y + 45}" class="body" font-size="11" font-weight="800" fill="${palette.text}">${escapeXml(shorten(layer.project, 22))}</text><circle cx="${x + 165}" cy="${y + 43}" r="3" fill="${accent}"/></g>`;
      })
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} connected workbench" data-mode="${mode}">
      ${workbenchDefs(palette)}${workbenchStyle()}<rect width="1200" height="330" fill="${palette.background}"/><rect x="10" y="10" width="1180" height="310" rx="12" fill="url(#board-glow)" stroke="${palette.trace}"/><rect x="10" y="10" width="1180" height="310" rx="12" fill="url(#perf)"/>
      <path d="${cutCard(24, 27, 148, 276)}" fill="${palette.module}" stroke="${palette.trace}"/><text x="51" y="61" class="mono" font-size="8" letter-spacing="2" fill="${palette.primary}">SIGNAL MAP</text><text x="51" y="104" class="display" font-size="39" font-weight="900" fill="${palette.text}">${String(config.layers.length).padStart(2, "0")}</text><text x="51" y="123" class="mono" font-size="7" letter-spacing="1.4" fill="${palette.muted}">MODULES ONLINE</text><path d="M51 148H144" stroke="${palette.trace}"/>
      <circle cx="58" cy="179" r="4" fill="${palette.primary}"/><text x="73" y="182" class="mono" font-size="7" letter-spacing="1.3" fill="${palette.muted}">PRIMARY</text><circle cx="58" cy="207" r="4" fill="${palette.secondary}"/><text x="73" y="210" class="mono" font-size="7" letter-spacing="1.3" fill="${palette.muted}">SECONDARY</text><path d="M51 237H144" stroke="${palette.trace}"/><text x="51" y="263" class="mono" font-size="7" letter-spacing="1.2" fill="${palette.text}">BUS / 01</text><text x="51" y="283" class="mono" font-size="7" letter-spacing="1.2" fill="${palette.muted}">STATUS / LIVE</text>
      <path d="${signalPath}" fill="none" stroke="${palette.trace}" stroke-width="5"/><path class="signal" d="${signalPath}" fill="none" stroke="${palette.primary}" stroke-width="2"/>${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="8" fill="${palette.board}" stroke="${palette.primary}"/>`).join("")}${modules}
      <text x="1163" y="302" text-anchor="end" class="mono" font-size="7" letter-spacing="1.6" fill="${palette.muted}">${escapeXml(shorten(config.identity.headline, 34).toUpperCase())} / CONNECTED WORKBENCH</text>
    </svg>`;
  }
}
