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

function flagshipSignals(config: ProfileConfig, palette: Palette): string {
  const positions = [
    { x: 806, y: 112 },
    { x: 1028, y: 154 },
    { x: 846, y: 253 },
  ] as const;
  const links = positions
    .map((position) => `L${position.x} ${position.y}`)
    .join("");
  const nodes = config.flagships
    .slice(0, 3)
    .map((project, index) => {
      const position = positions[index]!;
      const color = toneColor(project.tone, palette);
      return `<g><circle cx="${position.x}" cy="${position.y}" r="35" fill="${palette.panel}" stroke="${color}" stroke-width="2"/><circle class="pulse" cx="${position.x}" cy="${position.y}" r="7" fill="${color}" filter="url(#industrial-glow)"/>
        <text x="${position.x}" y="${position.y + 54}" text-anchor="middle" font-size="9" font-weight="800" fill="${palette.text}">${escapeXml(shorten(project.repo, 22))}</text><text x="${position.x}" y="${position.y + 68}" text-anchor="middle" font-size="7" letter-spacing="1.2" fill="${color}">${escapeXml(shorten(project.role, 13).toUpperCase())}</text></g>`;
    })
    .join("");
  return `<path d="M920 165${links}" fill="none" stroke="${palette.line}"/><path class="flow" d="M920 165${links}" fill="none" stroke="url(#industrial-accent)"/>${nodes}`;
}

function signalBands(config: ProfileConfig, palette: Palette): string {
  const count = config.layers.length;
  const width = (1128 - (count - 1) * 8) / count;
  return config.layers
    .map((layer, index) => {
      const x = 36 + index * (width + 8);
      const color = toneColor(layer.tone, palette);
      return `<g><rect x="${x.toFixed(1)}" y="307" width="${width.toFixed(1)}" height="26" fill="${palette.panel}" stroke="${color}" stroke-opacity=".75"/><rect x="${x.toFixed(1)}" y="307" width="${Math.max(4, width * 0.08).toFixed(1)}" height="26" fill="${color}"/><text x="${(x + width / 2).toFixed(1)}" y="324" text-anchor="middle" font-size="7" font-weight="700" fill="${palette.text}">${escapeXml(shorten(layer.name, 12))}</text></g>`;
    })
    .join("");
}

export class SignalGridRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createPalette(config, mode);
    const [lineOne, lineTwo] = splitIndustrialHeadline(
      config.identity.headline,
    );
    const fontSize = Math.max(lineOne.length, lineTwo.length) > 22 ? 32 : 40;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} signal grid" data-mode="${mode}">
      ${industrialDefinitions(palette)}${industrialStyle()}<rect width="1200" height="360" rx="18" fill="url(#industrial-bg)"/><rect width="1200" height="360" rx="18" fill="url(#industrial-grid)" opacity=".68"/><rect x="680" y="44" width="500" height="246" fill="url(#industrial-dots)" opacity=".76"/>
      <path d="M0 1H1200" stroke="url(#industrial-accent)" stroke-width="2"/><g transform="translate(20 22)"><circle cx="0" r="4" fill="#EF4B5A"/><circle cx="18" r="4" fill="#E6A425"/><circle cx="36" r="4" fill="#22A447"/><text x="58" y="4" class="micro" fill="${palette.muted}">${escapeXml(config.identity.name.toUpperCase())} / SIGNAL_GRID</text></g><g transform="translate(1042 22)"><circle class="flicker" r="4" fill="${palette.primary}"/><text x="14" y="4" class="micro" fill="${palette.muted}">LINK STABLE</text></g><path d="M0 44H1200" stroke="${palette.line}"/>
      <path d="M36 70H648V282H36Z" fill="${palette.panel}" fill-opacity=".34" stroke="${palette.line}"/><path d="M36 70h84M36 70v52M648 282h-84M648 282v-52" stroke="${palette.primary}" stroke-width="2"/>
      <text x="62" y="102" class="label" fill="${palette.primary}">// IDENTITY TRANSMISSION</text><text x="60" y="154" font-size="${fontSize}" font-weight="900" letter-spacing="-1.4" fill="${palette.text}">${escapeXml(lineOne)}</text>${lineTwo ? `<text x="60" y="${154 + fontSize}" font-size="${fontSize}" font-weight="900" letter-spacing="-1.4" fill="${palette.text}">${escapeXml(lineTwo)}</text>` : ""}
      <text x="62" y="238" font-size="11" letter-spacing="1.2" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline.toUpperCase(), 69))}</text><path class="scan" d="M62 259H308" stroke="${palette.secondary}" stroke-width="3"/><text x="62" y="276" class="micro" fill="${palette.text}">${String(config.layers.length).padStart(2, "0")} NETWORKED LAYERS / ${String(config.flagships.length).padStart(2, "0")} PRIMARY SIGNALS</text>
      <g transform="translate(920 165)"><circle r="47" fill="${palette.panel}" stroke="${palette.line}"/><circle r="33" fill="none" stroke="url(#industrial-accent)" stroke-dasharray="6 7"/><path d="M0-56V56M-56 0H56" stroke="${palette.line}"/><circle class="pulse" r="7" fill="${palette.primary}" filter="url(#industrial-glow)"/></g>${flagshipSignals(config, palette)}
      <text x="700" y="66" class="label" fill="${palette.secondary}">PRIMARY SIGNAL TOPOLOGY</text><text x="1170" y="284" text-anchor="end" class="micro" fill="${palette.muted}">CARRIER / ${escapeXml(config.github.username.toUpperCase())}</text>${signalBands(config, palette)}
      <rect x="1" y="1" width="1198" height="358" rx="18" fill="none" stroke="${palette.primary}" stroke-opacity=".72"/></svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createPalette(config, mode);
    const columns = Math.min(5, Math.ceil(config.layers.length / 2));
    const points = config.layers.map((layer, index) => {
      const row = index % 2;
      const column = Math.floor(index / 2);
      const spacing = columns === 1 ? 0 : 980 / (columns - 1);
      return {
        layer,
        x: columns === 1 ? 600 : 110 + column * spacing,
        y: row === 0 ? 105 : 235,
      };
    });
    const mesh = points
      .flatMap((point, index) => {
        const next = points[index + 1];
        const across = points[index + 2];
        return [next, across]
          .filter((candidate) => candidate !== undefined)
          .map(
            (candidate) =>
              `<path d="M${point.x.toFixed(1)} ${point.y}L${candidate.x.toFixed(1)} ${candidate.y}" stroke="${palette.line}"/>`,
          );
      })
      .join("");
    const nodes = points
      .map(({ layer, x, y }, index) => {
        const color = toneColor(layer.tone, palette);
        return `<g><circle cx="${x.toFixed(1)}" cy="${y}" r="24" fill="${palette.panel}" stroke="${color}" stroke-width="2"/><circle class="pulse" cx="${x.toFixed(1)}" cy="${y}" r="5" fill="${color}"/><text x="${x.toFixed(1)}" y="${y + 3}" text-anchor="middle" font-size="7" font-weight="700" fill="${color}">${String(index + 1).padStart(2, "0")}</text>
          <text x="${x.toFixed(1)}" y="${y + (y < 170 ? -36 : 43)}" text-anchor="middle" font-size="9" font-weight="800" fill="${palette.text}">${escapeXml(shorten(layer.name, 16))}</text><text x="${x.toFixed(1)}" y="${y + (y < 170 ? -24 : 55)}" text-anchor="middle" font-size="7" fill="${palette.muted}">${escapeXml(shorten(layer.project, 21))}</text></g>`;
      })
      .join("");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} signal topology" data-mode="${mode}">
      ${industrialDefinitions(palette)}${industrialStyle()}<rect width="1200" height="330" rx="18" fill="url(#industrial-bg)"/><rect width="1200" height="330" rx="18" fill="url(#industrial-grid)" opacity=".68"/><rect width="1200" height="330" rx="18" fill="url(#industrial-dots)" opacity=".28"/>
      <text x="28" y="33" class="label" fill="${palette.primary}">SIGNAL GRID / NETWORK TOPOLOGY</text><text x="1170" y="33" text-anchor="end" class="micro" fill="${palette.muted}">${String(config.layers.length).padStart(2, "0")} NODES · MESH ONLINE</text>${mesh}<path class="flow" d="M64 170H1136" stroke="url(#industrial-accent)" stroke-width="2"/>
      <g transform="translate(600 170)"><circle r="39" fill="${palette.background}" stroke="${palette.line}"/><circle r="28" fill="none" stroke="url(#industrial-accent)" stroke-dasharray="5 6"/><circle class="pulse" r="6" fill="${palette.primary}"/></g>${nodes}<rect x="1" y="1" width="1198" height="328" rx="18" fill="none" stroke="${palette.secondary}" stroke-opacity=".6"/></svg>`;
  }
}
