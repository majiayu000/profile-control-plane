import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
} from "../../core/types.js";
import { shorten, toneColor } from "../shared.js";

interface EditorialPalette {
  readonly background: string;
  readonly paper: string;
  readonly ink: string;
  readonly muted: string;
  readonly rule: string;
  readonly spine: string;
  readonly spineInk: string;
  readonly primary: string;
  readonly secondary: string;
}

function createEditorialPalette(
  config: ProfileConfig,
  mode: ColorMode,
): EditorialPalette {
  return mode === "dark"
    ? {
        background: "#0D0E0C",
        paper: "#191A16",
        ink: "#F4EEDC",
        muted: "#AAA797",
        rule: "#45463E",
        spine: "#E9E2D0",
        spineInk: "#11120F",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      }
    : {
        background: "#DCD5C7",
        paper: "#F4EDDF",
        ink: "#171915",
        muted: "#6E6B61",
        rule: "#B9B1A2",
        spine: "#1B1D19",
        spineInk: "#F4EDDF",
        primary: config.theme.primary,
        secondary: config.theme.secondary,
      };
}

function editorialStyle(): string {
  return `<style>
    .display{font-family:Georgia,"Times New Roman",serif}.grotesk{font-family:"Arial Narrow","Avenir Next Condensed",Impact,sans-serif}.body{font-family:"Avenir Next",Avenir,Helvetica,sans-serif}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .enter{animation:enter .65s cubic-bezier(.2,.8,.2,1)}.scan{stroke-dasharray:3 8;animation:scan 9s linear infinite}
    @keyframes enter{from{opacity:.25;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes scan{to{stroke-dashoffset:-120}}
    @media(prefers-reduced-motion:reduce){.enter,.scan{animation:none}}
  </style>`;
}

function editorialDefs(palette: EditorialPalette): string {
  return `<defs>
    <pattern id="paper-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${palette.rule}" stroke-opacity=".17"/></pattern>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="2" seed="7"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .045 0"/></filter>
  </defs>`;
}

function splitHeadline(value: string): readonly [string, string] {
  const words = value.trim().split(/\s+/);
  if (words.length === 1) return [words[0] ?? "", ""];
  const split = Math.ceil(words.length / 2);
  return [words.slice(0, split).join(" "), words.slice(split).join(" ")];
}

function dossierRows(config: ProfileConfig, palette: EditorialPalette): string {
  return config.flagships
    .slice(0, 3)
    .map((project, index) => {
      const y = 93 + index * 70;
      const accent = toneColor(project.tone, palette);
      return `<g class="enter" style="animation-delay:${120 + index * 70}ms">
        <text x="790" y="${y}" class="grotesk" font-size="30" font-weight="900" fill="${accent}" opacity=".82">${String(index + 1).padStart(2, "0")}</text>
        <text x="850" y="${y - 6}" class="body" font-size="15" font-weight="800" fill="${palette.ink}">${escapeXml(shorten(project.repo, 28))}</text>
        <text x="850" y="${y + 13}" class="mono" font-size="8" letter-spacing="1.5" fill="${accent}">${escapeXml(shorten(project.role, 16).toUpperCase())} / SELECTED SYSTEM</text>
        <text x="850" y="${y + 34}" class="body" font-size="10" fill="${palette.muted}">${escapeXml(shorten(project.description, 48))}</text>
        <path d="M790 ${y + 47}H1152" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
}

export class EditorialRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createEditorialPalette(config, mode);
    const [lineOne, lineTwo] = splitHeadline(config.identity.headline);
    const headlineSize =
      Math.max(lineOne.length, lineTwo.length) > 22 ? 39 : 46;
    const location = config.identity.location
      ? escapeXml(shorten(config.identity.location, 22))
      : "FIELD NOTES";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} editorial profile" data-mode="${mode}">
      ${editorialDefs(palette)}${editorialStyle()}<rect width="1200" height="360" fill="${palette.background}"/><rect x="13" y="13" width="1174" height="334" fill="${palette.paper}" stroke="${palette.rule}"/><rect x="13" y="13" width="1174" height="334" fill="url(#paper-grid)"/>
      <rect x="13" y="13" width="156" height="334" fill="${palette.spine}"/><rect x="26" y="26" width="5" height="72" fill="${palette.primary}"/><rect x="26" y="105" width="5" height="34" fill="${palette.secondary}"/>
      <text x="91" y="220" text-anchor="middle" class="grotesk" font-size="164" font-weight="900" letter-spacing="-10" fill="${palette.spineInk}">01</text><text x="91" y="253" text-anchor="middle" class="mono" font-size="8" letter-spacing="3" fill="${palette.spineInk}">SYSTEMS REVIEW</text>
      <path d="M52 281H130" stroke="${palette.spineInk}"/><text x="91" y="307" text-anchor="middle" class="mono" font-size="8" letter-spacing="2" fill="${palette.spineInk}">${String(config.flagships.length).padStart(2, "0")} WORKS</text><text x="91" y="326" text-anchor="middle" class="mono" font-size="8" letter-spacing="2" fill="${palette.spineInk}">${location.toUpperCase()}</text>
      <g class="enter"><text x="199" y="48" class="mono" font-size="8" letter-spacing="2.5" fill="${palette.primary}">PROFILE DOSSIER / ${escapeXml(config.identity.name.toUpperCase())}</text><path d="M199 62H730" stroke="${palette.rule}"/>
      <text x="196" y="122" class="display" font-size="${headlineSize}" font-weight="700" letter-spacing="-1" fill="${palette.ink}">${escapeXml(lineOne)}</text>${lineTwo ? `<text x="196" y="${122 + headlineSize}" class="display" font-size="${headlineSize}" font-style="italic" letter-spacing="-1" fill="${palette.ink}">${escapeXml(lineTwo)}</text>` : ""}
      <rect x="199" y="218" width="42" height="4" fill="${palette.secondary}"/><text x="199" y="250" class="body" font-size="12" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 75))}</text>
      <text x="199" y="294" class="mono" font-size="8" letter-spacing="2" fill="${palette.ink}">AUTHORED SYSTEMS · OPEN SOURCE · ${String(config.layers.length).padStart(2, "0")} ACTIVE LAYERS</text><path class="scan" d="M199 314H730" stroke="${palette.primary}" stroke-width="2"/></g>
      <path d="M758 30V330" stroke="${palette.rule}"/><text x="790" y="47" class="display" font-size="17" font-style="italic" fill="${palette.ink}">Editor&apos;s selection</text><text x="1152" y="47" text-anchor="end" class="mono" font-size="8" letter-spacing="2" fill="${palette.muted}">VOL. 01 / ${String(config.flagships.length).padStart(2, "0")}</text>${dossierRows(config, palette)}
      <rect x="1157" y="317" width="5" height="5" fill="${palette.primary}"/><rect x="1145" y="317" width="5" height="5" fill="${palette.secondary}"/><rect x="13" y="13" width="1174" height="334" filter="url(#grain)" opacity=".28" pointer-events="none"/>
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createEditorialPalette(config, mode);
    const rows = config.layers
      .map((layer, index) => {
        const column = Math.floor(index / 5);
        const row = index % 5;
        const x = 205 + column * 484;
        const y = 78 + row * 50;
        const accent = toneColor(layer.tone, palette);
        return `<g class="enter" style="animation-delay:${index * 45}ms">
          <rect x="${x}" y="${y - 17}" width="4" height="36" fill="${accent}"/><text x="${x + 16}" y="${y - 3}" class="mono" font-size="8" letter-spacing="1.5" fill="${accent}">${String(index + 1).padStart(2, "0")}</text>
          <text x="${x + 49}" y="${y - 3}" class="body" font-size="12" font-weight="800" fill="${palette.ink}">${escapeXml(shorten(layer.name, 18))}</text><text x="${x + 49}" y="${y + 14}" class="display" font-size="12" font-style="italic" fill="${palette.muted}">${escapeXml(shorten(layer.project, 29))}</text>
          <path d="M${x + 16} ${y + 23}H${x + 444}" stroke="${palette.rule}"/>
        </g>`;
      })
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} working index" data-mode="${mode}">
      ${editorialDefs(palette)}${editorialStyle()}<rect width="1200" height="330" fill="${palette.background}"/><rect x="13" y="13" width="1174" height="304" fill="${palette.paper}" stroke="${palette.rule}"/><rect x="13" y="13" width="1174" height="304" fill="url(#paper-grid)"/>
      <rect x="13" y="13" width="156" height="304" fill="${palette.spine}"/><text x="91" y="76" text-anchor="middle" class="mono" font-size="8" letter-spacing="3" fill="${palette.spineInk}">CONTENTS</text><text x="91" y="208" text-anchor="middle" class="grotesk" font-size="108" font-weight="900" fill="${palette.spineInk}">${String(config.layers.length).padStart(2, "0")}</text><path d="M51 229H131" stroke="${palette.spineInk}"/><text x="91" y="258" text-anchor="middle" class="mono" font-size="8" letter-spacing="2" fill="${palette.spineInk}">ACTIVE LAYERS</text>
      <text x="205" y="42" class="display" font-size="18" font-style="italic" fill="${palette.ink}">Working index</text><text x="1150" y="42" text-anchor="end" class="mono" font-size="8" letter-spacing="2" fill="${palette.muted}">${escapeXml(shorten(config.identity.headline, 36).toUpperCase())} / VOL. 01</text><path d="M205 55H1150" stroke="${palette.rule}"/><path d="M674 65V298" stroke="${palette.rule}"/>${rows}
      <rect x="13" y="13" width="1174" height="304" filter="url(#grain)" opacity=".25" pointer-events="none"/>
    </svg>`;
  }
}
