import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
  Tone,
} from "../../core/types.js";
import { shorten } from "../shared.js";

interface ForgePalette {
  readonly background: string;
  readonly paper: string;
  readonly panel: string;
  readonly ink: string;
  readonly muted: string;
  readonly rule: string;
  readonly ember: string;
  readonly quench: string;
  readonly iron: string;
  readonly userPrimary: string;
  readonly userSecondary: string;
}

function createForgePalette(
  config: ProfileConfig,
  mode: ColorMode,
): ForgePalette {
  const accents = {
    userPrimary: escapeXml(config.theme.primary),
    userSecondary: escapeXml(config.theme.secondary),
  };
  return mode === "dark"
    ? {
        background: "#0B0908",
        paper: "#151010",
        panel: "#201713",
        ink: "#F6EDDB",
        muted: "#A99C86",
        rule: "#3F3226",
        ember: "#FF7C1E",
        quench: "#66A9CC",
        iron: "#8B95A2",
        ...accents,
      }
    : {
        background: "#D6D0C2",
        paper: "#E9E2D1",
        panel: "#F4EDDC",
        ink: "#241B11",
        muted: "#706050",
        rule: "#B1A58C",
        ember: "#BE4D0C",
        quench: "#34637D",
        iron: "#57626E",
        ...accents,
      };
}

function forgeStyle(): string {
  return `<style>
    .forge-serif{font-family:Iowan Old Style,Palatino Linotype,Book Antiqua,Georgia,serif}.forge-label{font-family:Avenir Next Condensed,Arial Narrow,sans-serif}.forge-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .forge-pour{stroke-dasharray:8 12;animation:forge-pour 5.5s linear infinite}.forge-glow{animation:forge-glow 2.8s ease-in-out infinite}.forge-spark{transform-box:fill-box;transform-origin:center;animation:forge-spark 3.1s ease-in-out infinite}.forge-rise{animation:forge-rise .62s cubic-bezier(.2,.75,.2,1) both}
    @keyframes forge-pour{to{stroke-dashoffset:-140}}@keyframes forge-glow{50%{opacity:.45}}@keyframes forge-spark{0%,100%{transform:translateY(0);opacity:.9}55%{transform:translateY(-5px);opacity:.35}}@keyframes forge-rise{from{opacity:.16;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
    @media(prefers-reduced-motion:reduce){.forge-pour,.forge-glow,.forge-spark,.forge-rise{animation:none}}
  </style>`;
}

function forgeDefs(palette: ForgePalette): string {
  return `<defs>
    <pattern id="forge-grit" width="34" height="34" patternUnits="userSpaceOnUse"><circle cx="6" cy="8" r="1" fill="${palette.rule}" fill-opacity=".3"/><circle cx="24" cy="26" r=".8" fill="${palette.rule}" fill-opacity=".22"/></pattern>
    <filter id="forge-heat" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="7"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .03 0"/></filter>
    <g id="forge-ingot"><path d="M-11 6H11L8-6H-8Z" fill="none" stroke="${palette.iron}" stroke-width="1.6"/><path d="M-6 6L-4-6M4-6L6 6" stroke="${palette.iron}" stroke-opacity=".55"/></g>
  </defs>`;
}

function splitForgeHeadline(value: string): readonly [string, string] {
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

function forgeToneInk(tone: Tone, palette: ForgePalette): string {
  return tone === "primary" ? palette.ember : palette.quench;
}

function castingRows(config: ProfileConfig, palette: ForgePalette): string {
  const limit = 6;
  const rows = config.flagships
    .slice(0, limit)
    .map((project, index) => {
      const y = 76 + index * 44;
      const sprueY = 174 + (index - 2.5) * 9;
      const accent = forgeToneInk(project.tone, palette);
      return `<g class="forge-rise" style="animation-delay:${100 + index * 55}ms">
        <path d="M585 ${sprueY.toFixed(1)}C622 ${sprueY.toFixed(1)} 644 ${y - 6} 686 ${y - 6}" fill="none" stroke="${accent}" stroke-opacity=".72"/><path class="forge-pour" d="M585 ${sprueY.toFixed(1)}C622 ${sprueY.toFixed(1)} 644 ${y - 6} 686 ${y - 6}" fill="none" stroke="${palette.ember}" stroke-width="1.5"/>
        <use href="#forge-ingot" transform="translate(700 ${y - 6})"/><circle class="forge-spark" style="animation-delay:${(index * 0.43).toFixed(2)}s" cx="714" cy="${y - 15}" r="1.8" fill="${palette.ember}"/>
        <text x="724" y="${y - 10}" class="forge-label" font-size="12" font-weight="800" fill="${palette.ink}">${escapeXml(shorten(project.repo, 26))}</text><text x="1142" y="${y - 10}" text-anchor="end" class="forge-mono" font-size="7.5" letter-spacing="1.3" fill="${accent}">${escapeXml(shorten(project.role, 18).toUpperCase())}</text>
        <text x="724" y="${y + 7}" class="forge-label" font-size="8.7" fill="${palette.muted}">${escapeXml(shorten(project.description, 57))}</text><path d="M724 ${y + 16}H1142" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
  const remainder = config.flagships.length - limit;
  return `${rows}${remainder > 0 ? `<text x="1142" y="318" text-anchor="end" class="forge-mono" font-size="8" fill="${palette.ember}">+${remainder} CASTS IN THE YARD</text>` : ""}`;
}

function alloyRows(config: ProfileConfig, palette: ForgePalette): string {
  const limit = 10;
  const rows = config.layers
    .slice(0, limit)
    .map((layer, index) => {
      const column = Math.floor(index / 5);
      const row = index % 5;
      const x = 309 + column * 438;
      const y = 78 + row * 47;
      const accent = forgeToneInk(layer.tone, palette);
      return `<g class="forge-rise" style="animation-delay:${index * 42}ms">
        <path d="M${x - 19} ${y + 13}C${x - 8} ${y + 13} ${x - 10} ${y - 5} ${x - 3} ${y - 5}" fill="none" stroke="${accent}"/><g transform="translate(${x + 8} ${y - 5}) scale(.75)"><use href="#forge-ingot"/></g>
        <text x="${x + 25}" y="${y - 8}" class="forge-mono" font-size="7.5" letter-spacing="1.3" fill="${accent}">${String(index + 1).padStart(2, "0")} / ${escapeXml(shorten(layer.name, 16).toUpperCase())}</text><text x="${x + 191}" y="${y - 8}" class="forge-serif" font-size="11" font-style="italic" fill="${palette.ink}">${escapeXml(shorten(layer.project, 22))}</text>
        <text x="${x + 25}" y="${y + 9}" class="forge-label" font-size="8.5" fill="${palette.muted}">${escapeXml(shorten(layer.description, 52))}</text><path d="M${x + 25} ${y + 17}H${x + 399}" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
  const remainder = config.layers.length - limit;
  return `${rows}${remainder > 0 ? `<text x="1146" y="313" text-anchor="end" class="forge-mono" font-size="8" fill="${palette.ember}">+${remainder} ALLOYS IN STOCK</text>` : ""}`;
}

export class FoundryRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createForgePalette(config, mode);
    const [headlineOne, headlineTwo] = splitForgeHeadline(
      config.identity.headline,
    );
    const headlineSize =
      Math.max(headlineOne.length, headlineTwo.length) > 24 ? 31 : 36;
    const location = config.identity.location
      ? `<text x="50" y="304" class="forge-mono" font-size="8" letter-spacing="1.6" fill="${palette.muted}">YARD / ${escapeXml(shorten(config.identity.location, 28).toUpperCase())}</text>`
      : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} foundry floor profile" data-mode="${mode}">
      ${forgeDefs(palette)}${forgeStyle()}<rect width="1200" height="360" fill="${palette.background}"/><rect x="14" y="14" width="1172" height="332" fill="${palette.paper}" stroke="${palette.rule}"/><rect x="14" y="14" width="1172" height="332" fill="url(#forge-grit)"/><rect x="14" y="14" width="1172" height="332" filter="url(#forge-heat)" opacity=".42" pointer-events="none"/>
      <rect x="30" y="30" width="500" height="300" fill="${palette.panel}" fill-opacity=".6" stroke="${palette.rule}"/><path d="M545 30V330" stroke="${palette.rule}"/><path d="M585 58V322" stroke="${palette.iron}" stroke-opacity=".55"/>
      <path d="M448 54H492L486 72H454Z" fill="none" stroke="${palette.iron}" stroke-width="2"/><path class="forge-pour" d="M470 74C474 130 466 210 452 268" fill="none" stroke="${palette.ember}" stroke-width="3"/><circle class="forge-spark" cx="484" cy="150" r="1.9" fill="${palette.ember}"/><circle class="forge-spark" style="animation-delay:.9s" cx="458" cy="205" r="1.6" fill="${palette.ember}"/><circle class="forge-glow" cx="452" cy="272" r="4.5" fill="${palette.ember}"/><use href="#forge-ingot" transform="translate(452 290)"/><use href="#forge-ingot" transform="translate(492 290)"/>
      <g class="forge-rise"><text x="50" y="49" class="forge-mono" font-size="8" letter-spacing="2.3" fill="${palette.ember}">FOUNDRY / CASTING FLOOR</text><text x="50" y="82" class="forge-label" font-size="12" font-weight="800" letter-spacing="2" fill="${palette.ink}">${escapeXml(shorten(config.identity.name, 28).toUpperCase())}</text>
      <text x="48" y="133" class="forge-serif" font-size="${headlineSize}" font-weight="700" fill="${palette.ink}">${escapeXml(headlineOne)}</text>${headlineTwo ? `<text x="48" y="${133 + headlineSize}" class="forge-serif" font-size="${headlineSize}" font-style="italic" fill="${palette.ink}">${escapeXml(headlineTwo)}</text>` : ""}
      <path d="M50 210H132" stroke="${palette.ember}" stroke-width="4"/><text x="50" y="238" class="forge-label" font-size="11" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 74))}</text>
      <text x="50" y="276" class="forge-mono" font-size="8" letter-spacing="1.5" fill="${palette.ink}">${String(config.flagships.length).padStart(2, "0")} CASTS POURED · ${String(config.layers.length).padStart(2, "0")} ALLOY LAYERS</text>${location}</g>
      <text x="660" y="47" class="forge-serif" font-size="16" font-style="italic" fill="${palette.ink}">Master casts</text><text x="1142" y="47" text-anchor="end" class="forge-mono" font-size="8" letter-spacing="1.4" fill="${palette.muted}">HEAT / ${escapeXml(shorten(config.github.username, 22).toUpperCase())}</text>${castingRows(config, palette)}
      <circle cx="500" cy="315" r="3" fill="${palette.userPrimary}"/><circle cx="512" cy="315" r="3" fill="${palette.userSecondary}"/>
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createForgePalette(config, mode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} alloy ledger" data-mode="${mode}">
      ${forgeDefs(palette)}${forgeStyle()}<rect width="1200" height="330" fill="${palette.background}"/><rect x="14" y="14" width="1172" height="302" fill="${palette.paper}" stroke="${palette.rule}"/><rect x="14" y="14" width="1172" height="302" fill="url(#forge-grit)"/><rect x="14" y="14" width="1172" height="302" filter="url(#forge-heat)" opacity=".4" pointer-events="none"/>
      <rect x="29" y="29" width="235" height="272" fill="${palette.panel}" fill-opacity=".64" stroke="${palette.rule}"/><text x="50" y="54" class="forge-mono" font-size="8" letter-spacing="2.1" fill="${palette.ember}">CRUCIBLE</text><text x="50" y="91" class="forge-serif" font-size="21" font-style="italic" fill="${palette.ink}">Casting floor</text>
      <path class="forge-pour" d="M146 104V130" fill="none" stroke="${palette.ember}" stroke-width="2.5"/><circle class="forge-spark" cx="132" cy="120" r="1.7" fill="${palette.ember}"/><circle class="forge-spark" style="animation-delay:1.1s" cx="160" cy="116" r="1.5" fill="${palette.ember}"/><use href="#forge-ingot" transform="translate(146 150) scale(1.6)"/><circle class="forge-glow" cx="146" cy="144" r="4" fill="${palette.ember}"/>
      <text x="146" y="222" text-anchor="middle" class="forge-serif" font-size="52" font-weight="700" fill="${palette.ink}">${String(config.layers.length).padStart(2, "0")}</text><text x="146" y="246" text-anchor="middle" class="forge-mono" font-size="8" letter-spacing="1.8" fill="${palette.ember}">ALLOYS SMELTED</text><text x="50" y="280" class="forge-label" font-size="9" fill="${palette.muted}">${escapeXml(shorten(config.identity.name, 24).toUpperCase())}</text>
      <text x="309" y="40" class="forge-mono" font-size="10" letter-spacing="2" fill="${palette.ember}">FOUNDRY / ALLOY LEDGER</text><text x="1146" y="40" text-anchor="end" class="forge-mono" font-size="8" letter-spacing="1.4" fill="${palette.muted}">${escapeXml(shorten(config.identity.headline, 38).toUpperCase())}</text><path d="M309 52H1146" stroke="${palette.rule}"/><path d="M727 61V303" stroke="${palette.rule}"/>
      ${alloyRows(config, palette)}<circle cx="1129" cy="293" r="3" fill="${palette.userPrimary}"/><circle cx="1141" cy="293" r="3" fill="${palette.userSecondary}"/>
    </svg>`;
  }
}
