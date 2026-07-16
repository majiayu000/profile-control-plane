import { escapeXml } from "../../core/escape.js";
import type {
  ColorMode,
  ProfileConfig,
  ThemeRenderer,
  Tone,
} from "../../core/types.js";
import { shorten } from "../shared.js";

interface FieldPalette {
  readonly background: string;
  readonly paper: string;
  readonly panel: string;
  readonly ink: string;
  readonly muted: string;
  readonly rule: string;
  readonly pine: string;
  readonly oxide: string;
  readonly mineral: string;
  readonly userPrimary: string;
  readonly userSecondary: string;
}

function createFieldPalette(
  config: ProfileConfig,
  mode: ColorMode,
): FieldPalette {
  const accents = {
    userPrimary: escapeXml(config.theme.primary),
    userSecondary: escapeXml(config.theme.secondary),
  };
  return mode === "dark"
    ? {
        background: "#101916",
        paper: "#1B2722",
        panel: "#22312A",
        ink: "#E8E8DA",
        muted: "#A7AFA4",
        rule: "#47574E",
        pine: "#699078",
        oxide: "#C56350",
        mineral: "#6992A8",
        ...accents,
      }
    : {
        background: "#CFD2C7",
        paper: "#E8E9DE",
        panel: "#F3F3E9",
        ink: "#24332C",
        muted: "#68736B",
        rule: "#AAB2A8",
        pine: "#315D49",
        oxide: "#A74838",
        mineral: "#3E718E",
        ...accents,
      };
}

function fieldStyle(): string {
  return `<style>
    .field-serif{font-family:Iowan Old Style,Palatino Linotype,Book Antiqua,Georgia,serif}.field-label{font-family:Avenir Next Condensed,Arial Narrow,sans-serif}.field-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
    .field-trace{stroke-dasharray:4 8;animation:field-trace 9s linear infinite}.field-pin{transform-box:fill-box;transform-origin:center;animation:field-pin 3.8s ease-in-out infinite}.field-rise{animation:field-rise .68s cubic-bezier(.2,.75,.2,1) both}
    @keyframes field-trace{to{stroke-dashoffset:-120}}@keyframes field-pin{50%{opacity:.45;transform:scale(.78)}}@keyframes field-rise{from{opacity:.18;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
    @media(prefers-reduced-motion:reduce){.field-trace,.field-pin,.field-rise{animation:none}}
  </style>`;
}

function fieldDefs(palette: FieldPalette): string {
  return `<defs>
    <pattern id="field-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="${palette.rule}" stroke-opacity=".12"/><path d="M5 28l4-4M23 8l4-4" stroke="${palette.mineral}" stroke-opacity=".13"/></pattern>
    <filter id="field-mineral" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="11"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .032 0"/></filter>
    <g id="field-specimen-pin"><path d="M0-9V9" stroke="${palette.oxide}"/><circle cy="-10" r="3.2" fill="${palette.oxide}"/><path d="M-5 9H5" stroke="${palette.mineral}"/></g>
  </defs>`;
}

function splitFieldHeadline(value: string): readonly [string, string] {
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

function fieldToneInk(tone: Tone, palette: FieldPalette): string {
  return tone === "primary" ? palette.pine : palette.oxide;
}

function flagshipBranches(
  config: ProfileConfig,
  palette: FieldPalette,
): string {
  const limit = 6;
  const rows = config.flagships
    .slice(0, limit)
    .map((project, index) => {
      const y = 76 + index * 44;
      const branchY = 174 + (index - 2.5) * 9;
      const accent = fieldToneInk(project.tone, palette);
      return `<g class="field-rise" style="animation-delay:${100 + index * 55}ms">
        <path d="M625 ${branchY.toFixed(1)}C668 ${branchY.toFixed(1)} 691 ${y - 6} 733 ${y - 6}" fill="none" stroke="${accent}" stroke-opacity=".72"/><path class="field-trace" d="M625 ${branchY.toFixed(1)}C668 ${branchY.toFixed(1)} 691 ${y - 6} 733 ${y - 6}" fill="none" stroke="${palette.mineral}" stroke-width="1.5"/>
        <g transform="translate(741 ${y - 6})"><use class="field-pin" style="animation-delay:${(index * 0.31).toFixed(2)}s" href="#field-specimen-pin"/></g>
        <text x="763" y="${y - 10}" class="field-label" font-size="12" font-weight="800" fill="${palette.ink}">${escapeXml(shorten(project.repo, 27))}</text><text x="1142" y="${y - 10}" text-anchor="end" class="field-mono" font-size="7.5" letter-spacing="1.3" fill="${accent}">${escapeXml(shorten(project.role, 18).toUpperCase())}</text>
        <text x="763" y="${y + 7}" class="field-label" font-size="8.7" fill="${palette.muted}">${escapeXml(shorten(project.description, 59))}</text><path d="M763 ${y + 16}H1142" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
  const remainder = config.flagships.length - limit;
  return `${rows}${remainder > 0 ? `<text x="1142" y="47" text-anchor="end" class="field-mono" font-size="8" fill="${palette.oxide}">+${remainder} SPECIMENS IN CATALOG</text>` : ""}`;
}

function keyRows(config: ProfileConfig, palette: FieldPalette): string {
  const limit = 10;
  const rows = config.layers
    .slice(0, limit)
    .map((layer, index) => {
      const column = Math.floor(index / 5);
      const row = index % 5;
      const x = 309 + column * 438;
      const y = 78 + row * 47;
      const accent = fieldToneInk(layer.tone, palette);
      return `<g class="field-rise" style="animation-delay:${index * 42}ms">
        <path d="M${x - 19} ${y + 13}C${x - 8} ${y + 13} ${x - 10} ${y - 5} ${x + 3} ${y - 5}" fill="none" stroke="${accent}"/><g transform="translate(${x + 8} ${y - 5}) scale(.72)"><use class="field-pin" href="#field-specimen-pin"/></g>
        <text x="${x + 25}" y="${y - 8}" class="field-mono" font-size="7.5" letter-spacing="1.3" fill="${accent}">${String(index + 1).padStart(2, "0")} / ${escapeXml(shorten(layer.name, 16).toUpperCase())}</text><text x="${x + 191}" y="${y - 8}" class="field-serif" font-size="11" font-style="italic" fill="${palette.ink}">${escapeXml(shorten(layer.project, 22))}</text>
        <text x="${x + 25}" y="${y + 9}" class="field-label" font-size="8.5" fill="${palette.muted}">${escapeXml(shorten(layer.description, 52))}</text><path d="M${x + 25} ${y + 17}H${x + 399}" stroke="${palette.rule}"/>
      </g>`;
    })
    .join("");
  const remainder = config.layers.length - limit;
  return `${rows}${remainder > 0 ? `<text x="1146" y="40" text-anchor="end" class="field-mono" font-size="8" fill="${palette.oxide}">+${remainder} TAXA IN COMPLETE KEY</text>` : ""}`;
}

function branchSkeleton(palette: FieldPalette): string {
  return `<g fill="none" stroke-linecap="round">
    <path d="M605 309C599 268 633 235 621 194C609 153 630 116 650 80C659 63 661 47 659 35" stroke="${palette.pine}" stroke-width="3"/>
    <path class="field-trace" d="M605 309C599 268 633 235 621 194C609 153 630 116 650 80C659 63 661 47 659 35" stroke="${palette.mineral}" stroke-width="1.5"/>
    <path d="M623 196C597 182 582 163 574 141M632 116C609 105 595 89 586 69M616 244C638 232 651 216 659 197" stroke="${palette.pine}" stroke-width="1.4"/>
    <circle cx="574" cy="141" r="3" fill="${palette.oxide}" stroke="none"/><circle cx="586" cy="69" r="3" fill="${palette.mineral}" stroke="none"/><circle cx="659" cy="197" r="3" fill="${palette.oxide}" stroke="none"/>
  </g>`;
}

export class FieldSpecimenRenderer implements ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string {
    const palette = createFieldPalette(config, mode);
    const [headlineOne, headlineTwo] = splitFieldHeadline(
      config.identity.headline,
    );
    const headlineSize =
      Math.max(headlineOne.length, headlineTwo.length) > 24 ? 31 : 36;
    const location = config.identity.location
      ? `<text x="50" y="308" class="field-mono" font-size="8" letter-spacing="1.6" fill="${palette.muted}">SITE / ${escapeXml(shorten(config.identity.location, 28).toUpperCase())}</text>`
      : "";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360" role="img" aria-label="${escapeXml(config.identity.name)} field specimen profile" data-mode="${mode}">
      ${fieldDefs(palette)}${fieldStyle()}<rect width="1200" height="360" fill="${palette.background}"/><rect x="14" y="14" width="1172" height="332" fill="${palette.paper}" stroke="${palette.rule}"/><rect x="14" y="14" width="1172" height="332" fill="url(#field-grid)"/><rect x="14" y="14" width="1172" height="332" filter="url(#field-mineral)" opacity=".42" pointer-events="none"/>
      <rect x="30" y="30" width="520" height="300" fill="${palette.panel}" fill-opacity=".58" stroke="${palette.rule}"/><path d="M50 58H526" stroke="${palette.mineral}"/><path d="M565 30V330" stroke="${palette.rule}"/>${branchSkeleton(palette)}
      <g class="field-rise"><text x="50" y="49" class="field-mono" font-size="8" letter-spacing="2.3" fill="${palette.mineral}">FIELD SPECIMEN / SYSTEMATIC INDEX</text><text x="50" y="82" class="field-label" font-size="12" font-weight="800" letter-spacing="2" fill="${palette.pine}">${escapeXml(shorten(config.identity.name, 28).toUpperCase())}</text>
      <text x="48" y="133" class="field-serif" font-size="${headlineSize}" font-weight="700" fill="${palette.ink}">${escapeXml(headlineOne)}</text>${headlineTwo ? `<text x="48" y="${133 + headlineSize}" class="field-serif" font-size="${headlineSize}" font-style="italic" fill="${palette.ink}">${escapeXml(headlineTwo)}</text>` : ""}
      <path d="M50 210H132" stroke="${palette.oxide}" stroke-width="4"/><text x="50" y="238" class="field-label" font-size="11" fill="${palette.muted}">${escapeXml(shorten(config.identity.tagline, 74))}</text>
      <text x="50" y="276" class="field-mono" font-size="8" letter-spacing="1.5" fill="${palette.ink}">${String(config.flagships.length).padStart(2, "0")} SPECIMENS · ${String(config.layers.length).padStart(2, "0")} CLASSIFIED LAYERS</text>${location}</g>
      <text x="763" y="47" class="field-serif" font-size="16" font-style="italic" fill="${palette.ink}">Pinned systems</text><text x="1142" y="47" text-anchor="end" class="field-mono" font-size="8" letter-spacing="1.4" fill="${palette.muted}">CATALOG / ${escapeXml(shorten(config.github.username, 22).toUpperCase())}</text>${flagshipBranches(config, palette)}
      <circle cx="526" cy="315" r="3" fill="${palette.userPrimary}"/><circle cx="514" cy="315" r="3" fill="${palette.userSecondary}"/><path d="M50 319H94m-22-8v16" stroke="${palette.oxide}"/>
    </svg>`;
  }

  renderLoop(config: ProfileConfig, mode: ColorMode): string {
    const palette = createFieldPalette(config, mode);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="330" viewBox="0 0 1200 330" role="img" aria-label="${escapeXml(config.identity.name)} field taxonomy" data-mode="${mode}">
      ${fieldDefs(palette)}${fieldStyle()}<rect width="1200" height="330" fill="${palette.background}"/><rect x="14" y="14" width="1172" height="302" fill="${palette.paper}" stroke="${palette.rule}"/><rect x="14" y="14" width="1172" height="302" fill="url(#field-grid)"/><rect x="14" y="14" width="1172" height="302" filter="url(#field-mineral)" opacity=".4" pointer-events="none"/>
      <rect x="29" y="29" width="235" height="272" fill="${palette.panel}" fill-opacity=".62" stroke="${palette.rule}"/><text x="50" y="54" class="field-mono" font-size="8" letter-spacing="2.1" fill="${palette.mineral}">DICHOTOMOUS KEY</text><text x="50" y="91" class="field-serif" font-size="21" font-style="italic" fill="${palette.ink}">Layer taxonomy</text>
      <path d="M58 244C57 207 86 186 77 151C69 120 88 94 111 75" fill="none" stroke="${palette.pine}" stroke-width="2.5"/><path class="field-trace" d="M58 244C57 207 86 186 77 151C69 120 88 94 111 75" fill="none" stroke="${palette.mineral}"/><g transform="translate(58 245)"><use class="field-pin" href="#field-specimen-pin"/></g>
      <text x="184" y="190" text-anchor="middle" class="field-serif" font-size="58" font-weight="700" fill="${palette.ink}">${String(config.layers.length).padStart(2, "0")}</text><text x="184" y="216" text-anchor="middle" class="field-mono" font-size="8" letter-spacing="1.8" fill="${palette.oxide}">TAXA OBSERVED</text><text x="50" y="280" class="field-label" font-size="9" fill="${palette.muted}">${escapeXml(shorten(config.identity.name, 24).toUpperCase())}</text>
      <text x="309" y="40" class="field-serif" font-size="17" font-style="italic" fill="${palette.ink}">LAYER TAXONOMY / CLASSIFICATION KEY</text><text x="1146" y="40" text-anchor="end" class="field-mono" font-size="8" letter-spacing="1.4" fill="${palette.muted}">${escapeXml(shorten(config.identity.headline, 38).toUpperCase())}</text><path d="M309 52H1146" stroke="${palette.rule}"/><path d="M727 61V303" stroke="${palette.rule}"/>
      ${keyRows(config, palette)}<circle cx="1129" cy="293" r="3" fill="${palette.userPrimary}"/><circle cx="1141" cy="293" r="3" fill="${palette.userSecondary}"/>
    </svg>`;
  }
}
