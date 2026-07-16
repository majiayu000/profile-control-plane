import { escapeXml } from "../../core/escape.js";
import type { ProfileConfig, ProfileLayer } from "../../core/types.js";
import { shorten, toneColor } from "../shared.js";
import type { Palette } from "./palette.js";
import { controlPlaneDefinitions, controlPlaneStyle } from "./primitives.js";

interface LoopCard {
  readonly layer: ProfileLayer;
  readonly index: number;
  readonly x: number;
  readonly y: number;
}

const CARD_WIDTH = 204;
const CARD_HEIGHT = 78;
const CARD_GAP = 28;
const START_X = 36;
const TOP_Y = 76;
const BOTTOM_Y = 198;

function createCards(config: ProfileConfig): readonly LoopCard[] {
  return config.layers.map((layer, index) => {
    const topRow = index < 5;
    const column = topRow ? index : 4 - (index - 5);
    return {
      layer,
      index,
      x: START_X + column * (CARD_WIDTH + CARD_GAP),
      y: topRow ? TOP_Y : BOTTOM_Y,
    };
  });
}

function routePath(cards: readonly LoopCard[]): string {
  const top = cards.filter((card) => card.y === TOP_Y);
  const bottom = cards.filter((card) => card.y === BOTTOM_Y);
  const topCenter = TOP_Y + CARD_HEIGHT / 2;
  const bottomCenter = BOTTOM_Y + CARD_HEIGHT / 2;
  const segments: string[] = [];

  for (let index = 0; index < top.length - 1; index += 1) {
    const current = top[index]!;
    const next = top[index + 1]!;
    segments.push(`M${current.x + CARD_WIDTH} ${topCenter}H${next.x}`);
  }

  const lastTop = top.at(-1)!;
  if (bottom.length > 0) {
    const firstBottom = bottom[0]!;
    segments.push(
      `M${lastTop.x + CARD_WIDTH} ${topCenter}H1180V${bottomCenter}H${firstBottom.x + CARD_WIDTH}`,
    );
    for (let index = 0; index < bottom.length - 1; index += 1) {
      const current = bottom[index]!;
      const next = bottom[index + 1]!;
      segments.push(`M${current.x} ${bottomCenter}H${next.x + CARD_WIDTH}`);
    }
    const lastBottom = bottom.at(-1)!;
    segments.push(
      `M${lastBottom.x} ${bottomCenter}H20V174H${START_X + CARD_WIDTH / 2}V${TOP_Y + CARD_HEIGHT}`,
    );
  } else {
    segments.push(
      `M${lastTop.x + CARD_WIDTH} ${topCenter}H1180V${bottomCenter}H20V174H${START_X + CARD_WIDTH / 2}V${TOP_Y + CARD_HEIGHT}`,
    );
  }
  return segments.join("");
}

function renderCards(cards: readonly LoopCard[], palette: Palette): string {
  return cards
    .map(({ layer, index, x, y }) => {
      const color = toneColor(layer.tone, palette);
      const title = shorten(layer.description || layer.project, 22);
      const project = shorten(layer.project, 31);
      return `<clipPath id="card-copy-${index}"><rect x="${x + 12}" y="${y + 8}" width="180" height="64"/></clipPath><g class="hot" style="animation-delay:${index * 0.24}s" data-layer-index="${index}">
        <rect x="${x}" y="${y}" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="6" fill="${palette.panel}" stroke="${color}" stroke-opacity=".72"/>
        <g clip-path="url(#card-copy-${index})"><text x="${x + 16}" y="${y + 21}" font-size="9" letter-spacing="1.7" fill="${color}">${String(index + 1).padStart(2, "0")} / ${escapeXml(shorten(layer.name, 17).toUpperCase())}</text>
        <text x="${x + 16}" y="${y + 48}" font-size="13" font-weight="700" fill="${palette.text}">${escapeXml(title)}</text>
        <text x="${x + 16}" y="${y + 66}" font-size="9" fill="${palette.muted}">${escapeXml(project)}</text></g>
      </g>`;
    })
    .join("");
}

export function renderCardLoop(
  config: ProfileConfig,
  palette: Palette,
  mode: "dark" | "light",
): string {
  const cards = createCards(config);
  const route = routePath(cards);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} closed loop architecture" data-mode="${mode}" data-route-clearance="card-ports">
    ${controlPlaneDefinitions(palette)}${controlPlaneStyle()}<rect width="1200" height="330" rx="18" fill="url(#bg)"/><rect width="1200" height="330" rx="18" fill="url(#grid)" opacity=".45"/>
    <text x="28" y="34" class="label" fill="${palette.primary}">// THE_CLOSED_LOOP</text><text x="245" y="34" font-size="10" letter-spacing="1.4" fill="${palette.muted}">INDEPENDENT SYSTEMS / SHARED CONTRACT / VERIFIED EXECUTION</text>
    <circle class="blink" cx="1125" cy="30" r="4" fill="${palette.secondary}" filter="url(#glow)"/><text x="1138" y="34" font-size="9" letter-spacing="1.3" fill="${palette.muted}">LIVE</text>
    <path d="${route}" fill="none" stroke="${palette.line}" stroke-width="3"/><path class="flow" d="${route}" fill="none" stroke="url(#accent)" stroke-width="1.6" marker-end="url(#loop-arrow)"/>
    ${renderCards(cards, palette)}<text x="36" y="309" font-size="9" letter-spacing="1.6" fill="${palette.muted}">INPUT: INTENT</text><text x="1164" y="309" text-anchor="end" font-size="9" letter-spacing="1.6" fill="${palette.muted}">OUTPUT: PROOF</text>
    <rect x="1" y="1" width="1198" height="328" rx="18" fill="none" stroke="${palette.secondary}" stroke-opacity=".55"/></svg>`;
}
