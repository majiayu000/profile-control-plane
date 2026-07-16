import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
} from "../../core/types.js";
import { createPalette, type Palette } from "../control-plane/palette.js";
import {
  industrialDefinitions,
  industrialStyle,
  splitIndustrialHeadline,
} from "../industrial.js";
import { shorten, toneColor } from "../shared.js";

function flagshipConsole(config: ProfileConfig, palette: Palette): string {
  return config.flagships
    .slice(0, 3)
    .map((project, index) => {
      const y = 96 + index * 74;
      const color = toneColor(project.tone, palette);
      return `<g class="boot" style="animation-delay:${(index * 0.18).toFixed(2)}s"><path d="M760 ${y - 24}H1148V${y + 31}H780L760 ${y + 11}Z" fill="${palette.panel}" fill-opacity=".88" stroke="${color}" stroke-opacity=".72"/>
        <text x="778" y="${y - 4}" font-size="8" font-weight="700" letter-spacing="1.5" fill="${color}">${String(index + 1).padStart(2, "0")} / ${escapeXml(shorten(project.role, 15).toUpperCase())}</text>
        <text x="778" y="${y + 15}" font-size="13" font-weight="800" fill="${palette.text}">${escapeXml(shorten(project.repo, 30))}</text><text x="1131" y="${y + 15}" text-anchor="end" font-size="8" fill="${palette.muted}">CHANNEL ${String(index + 1).padStart(2, "0")}</text>
        <circle class="pulse" cx="1129" cy="${y - 7}" r="3" fill="${color}"/></g>`;
    })
    .join("");
}

function deckMetrics(config: ProfileConfig, palette: Palette): string {
  const metrics = [
    ["LAYERS", String(config.layers.length).padStart(2, "0")],
    ["FLAGSHIPS", String(config.flagships.length).padStart(2, "0")],
    ["STATUS", "READY"],
  ] as const;
  return metrics
    .map(([label, value], index) => {
      const x = 38 + index * 205;
      const color = index === 1 ? palette.secondary : palette.primary;
      return `<g transform="translate(${x} 282)"><path d="M0 0H188L198 10V42H0Z" fill="${palette.panel}" stroke="${palette.line}"/><text x="14" y="16" font-size="7" letter-spacing="1.5" fill="${palette.muted}">${label}</text><text x="14" y="34" font-size="15" font-weight="900" fill="${color}">${value}</text><path d="M164 30h18" stroke="${color}"/><circle cx="182" cy="30" r="3" fill="${color}"/></g>`;
    })
    .join("");
}

export class CommandDeckRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createPalette(config, mode);
    const [lineOne, lineTwo] = splitIndustrialHeadline(
      config.identity.headline,
    );
    const fontSize = Math.max(lineOne.length, lineTwo.length) > 22 ? 34 : 43;
    const location = config.identity.location
      ? ` · ${escapeXml(config.identity.location)}`
      : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} command deck" data-mode="${mode}">
      ${industrialDefinitions(palette)}${industrialStyle()}<rect width="1200" height="360" rx="18" fill="url(#industrial-bg)"/><rect width="1200" height="360" rx="18" fill="url(#industrial-grid)" opacity=".68"/>
      <path d="M0 1H1200" stroke="url(#industrial-accent)" stroke-width="2"/><path d="M720 44V344" stroke="${palette.line}"/><path d="M730 44V344" stroke="${palette.grid}"/>
      <g transform="translate(20 22)"><circle cx="0" cy="0" r="4" fill="#EF4B5A"/><circle cx="18" cy="0" r="4" fill="#E6A425"/><circle cx="36" cy="0" r="4" fill="#22A447"/><text x="58" y="4" class="micro" fill="${palette.muted}">${escapeXml(config.identity.name.toUpperCase())} / COMMAND_DECK</text></g>
      <g transform="translate(1046 22)"><circle class="flicker" r="4" fill="${palette.primary}" filter="url(#industrial-glow)"/><text x="14" y="4" class="micro" fill="${palette.muted}">MISSION READY</text></g><path d="M0 44H1200" stroke="${palette.line}"/>
      <g class="boot"><text x="38" y="82" class="label" fill="${palette.primary}">// OPERATOR IDENTITY / SYSTEM COMMAND</text><text x="38" y="139" font-size="${fontSize}" font-weight="900" letter-spacing="-1.6" fill="${palette.text}">${escapeXml(lineOne)}</text>${lineTwo ? `<text x="38" y="${139 + fontSize}" font-size="${fontSize}" font-weight="900" letter-spacing="-1.6" fill="${palette.text}">${escapeXml(lineTwo)}</text>` : ""}
      <path d="M38 223H650" stroke="${palette.line}"/><path class="scan" d="M38 223H270" stroke="${palette.primary}" stroke-width="2"/><text x="38" y="250" font-size="11" letter-spacing="1.5" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline.toUpperCase(), 58))}${location}</text>${deckMetrics(config, palette)}</g>
      <text x="760" y="64" class="label" fill="${palette.secondary}">FLAGSHIP CHANNELS</text><text x="1148" y="64" text-anchor="end" class="micro" fill="${palette.muted}">03 PRIORITY SIGNALS</text>${flagshipConsole(config, palette)}
      <g transform="translate(1083 310)"><circle r="29" fill="${palette.panel}" stroke="${palette.line}"/><circle r="20" fill="none" stroke="url(#industrial-accent)" stroke-dasharray="5 5"/><path d="M0-16V16M-16 0H16" stroke="${palette.primary}"/><circle class="pulse" r="4" fill="${palette.secondary}"/></g><text x="760" y="322" class="micro" fill="${palette.muted}">CONTROL BUS / ONLINE</text>
      <rect x="1" y="1" width="1198" height="358" rx="18" fill="none" stroke="${palette.primary}" stroke-opacity=".72"/></svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createPalette(config, mode);
    const columns = Math.ceil(config.layers.length / 2);
    const spacing = columns === 1 ? 0 : 1000 / (columns - 1);
    const nodes = config.layers
      .map((layer, index) => {
        const row = index % 2;
        const column = Math.floor(index / 2);
        const centerX = columns === 1 ? 600 : 100 + column * spacing;
        const y = row === 0 ? 72 : 226;
        const color = toneColor(layer.tone, palette);
        const connectorY = row === 0 ? y + 50 : y - 18;
        return `<g><path d="M${centerX.toFixed(1)} 164V${connectorY}" stroke="${color}" stroke-opacity=".66"/><circle cx="${centerX.toFixed(1)}" cy="164" r="4" fill="${color}"/>
          <path d="M${(centerX - 82).toFixed(1)} ${y - 22}H${(centerX + 72).toFixed(1)}L${(centerX + 82).toFixed(1)} ${y - 12}V${y + 34}H${(centerX - 82).toFixed(1)}Z" fill="${palette.panel}" stroke="${color}"/>
          <text x="${(centerX - 66).toFixed(1)}" y="${y - 2}" font-size="8" letter-spacing="1.2" fill="${color}">${String(index + 1).padStart(2, "0")} / ${escapeXml(shorten(layer.name, 15))}</text><text x="${(centerX - 66).toFixed(1)}" y="${y + 19}" font-size="10" font-weight="800" fill="${palette.text}">${escapeXml(shorten(layer.project, 20))}</text><circle class="pulse" cx="${(centerX + 61).toFixed(1)}" cy="${y + 17}" r="3" fill="${color}"/></g>`;
      })
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} execution deck" data-mode="${mode}">
      ${industrialDefinitions(palette)}${industrialStyle()}<rect width="1200" height="330" rx="18" fill="url(#industrial-bg)"/><rect width="1200" height="330" rx="18" fill="url(#industrial-grid)" opacity=".68"/>
      <text x="28" y="33" class="label" fill="${palette.primary}">EXECUTION DECK / MISSION BUS</text><text x="1170" y="33" text-anchor="end" class="micro" fill="${palette.muted}">${String(config.layers.length).padStart(2, "0")} CHANNELS · STATUS READY</text>
      <path d="M42 164H1158" stroke="${palette.line}" stroke-width="5"/><path class="flow" d="M42 164H1158" stroke="url(#industrial-accent)" stroke-width="2"/><path d="M42 151V177M1158 151V177" stroke="${palette.primary}"/>${nodes}
      <rect x="542" y="153" width="116" height="22" rx="4" fill="${palette.background}" stroke="${palette.line}"/><text x="600" y="168" text-anchor="middle" font-size="8" font-weight="700" letter-spacing="2" fill="${palette.muted}">COMMAND BUS</text><rect x="1" y="1" width="1198" height="328" rx="18" fill="none" stroke="${palette.secondary}" stroke-opacity=".6"/></svg>`;
  }
}
