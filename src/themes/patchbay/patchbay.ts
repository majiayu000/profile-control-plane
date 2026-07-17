import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
  Tone,
} from "../../core/types.js";
import { shorten } from "../shared.js";

interface PatchPalette {
  readonly background: string;
  readonly panel: string;
  readonly faceplate: string;
  readonly ink: string;
  readonly muted: string;
  readonly rule: string;
  readonly brass: string;
  readonly coral: string;
  readonly steel: string;
  readonly userPrimary: string;
  readonly userSecondary: string;
}

function createPatchPalette(
  config: ProfileConfig,
  mode: ColorMode,
): PatchPalette {
  const accents = {
    userPrimary: escapeXml(config.theme.primary),
    userSecondary: escapeXml(config.theme.secondary),
  };
  return mode === "dark"
    ? {
        background: "#090B0F",
        panel: "#10151C",
        faceplate: "#161C26",
        ink: "#F2EFE3",
        muted: "#9BA7B5",
        rule: "#2B3543",
        brass: "#F2B23E",
        coral: "#F26A3D",
        steel: "#7F96AC",
        ...accents,
      }
    : {
        background: "#C7CBC8",
        panel: "#D9DCD7",
        faceplate: "#E7E9E3",
        ink: "#1E242A",
        muted: "#5A6470",
        rule: "#AFB5AC",
        brass: "#8A6708",
        coral: "#B8431F",
        steel: "#41586F",
        ...accents,
      };
}

function patchStyle(): string {
  return `<style>
    .patch-label{font-family:Avenir Next Condensed,Arial Narrow,sans-serif}.patch-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .patch-flow{stroke-dasharray:10 14;animation:patch-flow 6s linear infinite}.patch-led{animation:patch-led 2.6s ease-in-out infinite}.patch-vu{transform-box:fill-box;transform-origin:bottom;animation:patch-vu 1.9s ease-in-out infinite}.patch-rise{animation:patch-rise .6s cubic-bezier(.2,.75,.2,1) both}
    @keyframes patch-flow{to{stroke-dashoffset:-120}}@keyframes patch-led{50%{opacity:.2}}@keyframes patch-vu{0%,100%{transform:scaleY(.25)}45%{transform:scaleY(1)}70%{transform:scaleY(.55)}}@keyframes patch-rise{from{opacity:.15;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
    @media(prefers-reduced-motion:reduce){.patch-flow,.patch-led,.patch-vu,.patch-rise{animation:none}}
  </style>`;
}

function patchDefs(palette: PatchPalette): string {
  return `<defs>
    <pattern id="patch-grid" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1" fill="${palette.rule}" fill-opacity=".35"/></pattern>
    <g id="patch-jack"><circle r="7.5" fill="none" stroke="${palette.steel}" stroke-width="2"/><circle r="3.1" fill="${palette.background}"/></g>
  </defs>`;
}

function splitPatchHeadline(value: string): readonly [string, string] {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= 22) return [normalized, ""];
  const midpoint = Math.floor(normalized.length / 2);
  const spaces = [...normalized.matchAll(/ /g)]
    .map((match) => match.index)
    .filter((index): index is number => index !== undefined);
  const split =
    spaces.length > 0
      ? spaces.reduce((nearest, candidate) =>
          Math.abs(candidate - midpoint) < Math.abs(nearest - midpoint)
            ? candidate
            : nearest,
        )
      : midpoint;
  return [normalized.slice(0, split).trim(), normalized.slice(split).trim()];
}

function patchToneInk(tone: Tone, palette: PatchPalette): string {
  return tone === "primary" ? palette.brass : palette.coral;
}

function vuMeter(
  palette: PatchPalette,
  bars: number,
  baseline: number,
  originX: number,
  spacing: number,
): string {
  const heights = [34, 22, 28, 16, 30, 20, 26, 14];
  return Array.from({ length: bars }, (_, index) => {
    const height = heights[index % heights.length] ?? 20;
    const color = index % 3 === 2 ? palette.coral : palette.brass;
    return `<rect class="patch-vu" style="animation-delay:${(index * 0.23).toFixed(2)}s" x="${originX + index * spacing}" y="${baseline - height}" width="5" height="${height}" rx="1" fill="${color}"/>`;
  }).join("");
}

function flagshipPatches(config: ProfileConfig, palette: PatchPalette): string {
  const limit = 6;
  const rows = config.flagships
    .slice(0, limit)
    .map((project, index) => {
      const y = 76 + index * 44;
      const busY = 174 + (index - 2.5) * 9;
      const accent = patchToneInk(project.tone, palette);
      return `<g class="patch-rise" style="animation-delay:${100 + index * 55}ms">
        <path d="M585 ${busY.toFixed(1)}C622 ${busY.toFixed(1)} 644 ${y - 6} 686 ${y - 6}" fill="none" stroke="${accent}" stroke-opacity=".72"/><path class="patch-flow" d="M585 ${busY.toFixed(1)}C622 ${busY.toFixed(1)} 644 ${y - 6} 686 ${y - 6}" fill="none" stroke="${palette.brass}" stroke-width="1.5"/>
        <use href="#patch-jack" transform="translate(694 ${y - 6})"/><circle class="patch-led" style="animation-delay:${(index * 0.41).toFixed(2)}s" cx="710" cy="${y - 14}" r="2.4" fill="${palette.coral}"/>
        <text x="724" y="${y - 10}" class="patch-label" font-size="12" font-weight="800" fill="${palette.ink}">${escapeXml(shorten(project.repo, 26))}</text><text x="1142" y="${y - 10}" text-anchor="end" class="patch-mono" font-size="7.5" letter-spacing="1.3" fill="${accent}">${escapeXml(shorten(project.role, 18).toUpperCase())}</text>
        <text x="724" y="${y + 7}" class="patch-label" font-size="8.7" fill="${palette.muted}">${escapeXml(shorten(project.description, 57))}</text><path d="M724 ${y + 16}H1142" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
  const remainder = config.flagships.length - limit;
  return `${rows}${remainder > 0 ? `<text x="1142" y="318" text-anchor="end" class="patch-mono" font-size="8" fill="${palette.coral}">+${remainder} CHANNELS UNPATCHED</text>` : ""}`;
}

function channelRows(config: ProfileConfig, palette: PatchPalette): string {
  const limit = 10;
  const rows = config.layers
    .slice(0, limit)
    .map((layer, index) => {
      const column = Math.floor(index / 5);
      const row = index % 5;
      const x = 309 + column * 438;
      const y = 78 + row * 47;
      const accent = patchToneInk(layer.tone, palette);
      return `<g class="patch-rise" style="animation-delay:${index * 42}ms">
        <path d="M${x - 19} ${y + 13}C${x - 8} ${y + 13} ${x - 10} ${y - 5} ${x - 1} ${y - 5}" fill="none" stroke="${accent}"/><g transform="translate(${x + 8} ${y - 5}) scale(.72)"><use href="#patch-jack"/></g>
        <text x="${x + 25}" y="${y - 8}" class="patch-mono" font-size="7.5" letter-spacing="1.3" fill="${accent}">${String(index + 1).padStart(2, "0")} / ${escapeXml(shorten(layer.name, 16).toUpperCase())}</text><text x="${x + 191}" y="${y - 8}" class="patch-label" font-size="11" font-weight="800" fill="${palette.ink}">${escapeXml(shorten(layer.project, 22))}</text>
        <text x="${x + 25}" y="${y + 9}" class="patch-label" font-size="8.5" fill="${palette.muted}">${escapeXml(shorten(layer.description, 52))}</text><path d="M${x + 25} ${y + 17}H${x + 399}" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
  const remainder = config.layers.length - limit;
  return `${rows}${remainder > 0 ? `<text x="1146" y="313" text-anchor="end" class="patch-mono" font-size="8" fill="${palette.coral}">+${remainder} CHANNELS IN THE BAY</text>` : ""}`;
}

export class PatchbayRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createPatchPalette(config, mode);
    const [headlineOne, headlineTwo] = splitPatchHeadline(
      config.identity.headline,
    );
    const headlineSize =
      Math.max(headlineOne.length, headlineTwo.length) > 24 ? 31 : 36;
    const location = config.identity.location
      ? `<text x="50" y="304" class="patch-mono" font-size="8" letter-spacing="1.6" fill="${palette.muted}">RACK / ${escapeXml(shorten(config.identity.location, 28).toUpperCase())}</text>`
      : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} patch bay profile" data-mode="${mode}">
      ${patchDefs(palette)}${patchStyle()}<rect width="1200" height="360" fill="${palette.background}"/><rect x="14" y="14" width="1172" height="332" fill="${palette.panel}" stroke="${palette.rule}"/><rect x="14" y="14" width="1172" height="332" fill="url(#patch-grid)"/>
      <rect x="30" y="30" width="500" height="300" fill="${palette.faceplate}" fill-opacity=".62" stroke="${palette.rule}"/><circle cx="42" cy="42" r="2.6" fill="${palette.steel}"/><circle cx="518" cy="42" r="2.6" fill="${palette.steel}"/><circle cx="42" cy="318" r="2.6" fill="${palette.steel}"/><circle cx="518" cy="318" r="2.6" fill="${palette.steel}"/><path d="M545 30V330" stroke="${palette.rule}"/><path d="M585 58V322" stroke="${palette.steel}" stroke-opacity=".6"/>
      <g class="patch-rise"><text x="50" y="49" class="patch-mono" font-size="8" letter-spacing="2.3" fill="${palette.brass}">PATCH BAY / SIGNAL ROUTING</text><circle class="patch-led" cx="510" cy="46" r="3" fill="${palette.coral}"/><text x="50" y="82" class="patch-label" font-size="12" font-weight="800" letter-spacing="2" fill="${palette.ink}">${escapeXml(shorten(config.identity.name, 28).toUpperCase())}</text>
      <text x="48" y="133" class="patch-label" font-size="${headlineSize}" font-weight="800" fill="${palette.ink}">${escapeXml(headlineOne)}</text>${headlineTwo ? `<text x="48" y="${133 + headlineSize}" class="patch-label" font-size="${headlineSize}" font-weight="800" fill="${palette.brass}">${escapeXml(headlineTwo)}</text>` : ""}
      <path d="M50 210H132" stroke="${palette.brass}" stroke-width="4"/><text x="50" y="238" class="patch-label" font-size="11" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 74))}</text>
      <text x="50" y="276" class="patch-mono" font-size="8" letter-spacing="1.5" fill="${palette.ink}">${String(config.flagships.length).padStart(2, "0")} CHANNELS · ${String(config.layers.length).padStart(2, "0")} BUS LINES</text>${location}</g>
      ${vuMeter(palette, 8, 300, 440, 9)}
      <text x="660" y="47" class="patch-label" font-size="15" font-weight="800" fill="${palette.ink}">Patched channels</text><text x="1142" y="47" text-anchor="end" class="patch-mono" font-size="8" letter-spacing="1.4" fill="${palette.muted}">BUS / ${escapeXml(shorten(config.github.username, 22).toUpperCase())}</text>${flagshipPatches(config, palette)}
      <circle cx="500" cy="315" r="3" fill="${palette.userPrimary}"/><circle cx="512" cy="315" r="3" fill="${palette.userSecondary}"/>
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createPatchPalette(config, mode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} cable routing" data-mode="${mode}">
      ${patchDefs(palette)}${patchStyle()}<rect width="1200" height="330" fill="${palette.background}"/><rect x="14" y="14" width="1172" height="302" fill="${palette.panel}" stroke="${palette.rule}"/><rect x="14" y="14" width="1172" height="302" fill="url(#patch-grid)"/>
      <rect x="29" y="29" width="235" height="272" fill="${palette.faceplate}" fill-opacity=".66" stroke="${palette.rule}"/><text x="50" y="54" class="patch-mono" font-size="8" letter-spacing="2.1" fill="${palette.brass}">CHANNEL STRIP</text><text x="50" y="90" class="patch-label" font-size="20" font-weight="800" fill="${palette.ink}">Cable routing</text>
      ${vuMeter(palette, 9, 168, 50, 21)}
      <text x="146" y="222" text-anchor="middle" class="patch-label" font-size="52" font-weight="800" fill="${palette.ink}">${String(config.layers.length).padStart(2, "0")}</text><text x="146" y="246" text-anchor="middle" class="patch-mono" font-size="8" letter-spacing="1.8" fill="${palette.coral}">CHANNELS PATCHED</text><text x="50" y="280" class="patch-label" font-size="9" fill="${palette.muted}">${escapeXml(shorten(config.identity.name, 24).toUpperCase())}</text>
      <text x="309" y="40" class="patch-mono" font-size="10" letter-spacing="2" fill="${palette.brass}">PATCH BAY / CHANNEL MAP</text><text x="1146" y="40" text-anchor="end" class="patch-mono" font-size="8" letter-spacing="1.4" fill="${palette.muted}">${escapeXml(shorten(config.identity.headline, 38).toUpperCase())}</text><path d="M309 52H1146" stroke="${palette.rule}"/><path d="M727 61V303" stroke="${palette.rule}"/>
      ${channelRows(config, palette)}<circle cx="1129" cy="293" r="3" fill="${palette.userPrimary}"/><circle cx="1141" cy="293" r="3" fill="${palette.userSecondary}"/>
    </svg>`;
  }
}
