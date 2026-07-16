import type { Palette } from "./control-plane/palette.js";

export function industrialStyle(): string {
  return `<style>
    text{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace}
    .micro{font-size:9px;letter-spacing:2px}.label{font-size:11px;letter-spacing:2.5px;font-weight:700}
    .flow{stroke-dasharray:6 9;animation:flow 7s linear infinite}.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.4s ease-in-out infinite}.scan{animation:scan 5s ease-in-out infinite}.flicker{animation:flicker 2.2s ease-in-out infinite}
    @keyframes flow{to{stroke-dashoffset:-150}}@keyframes pulse{50%{opacity:.35;transform:scale(.72)}}@keyframes scan{50%{opacity:.28;transform:translateX(24px)}}@keyframes flicker{50%{opacity:.38}}
    @media(prefers-reduced-motion:reduce){.flow,.pulse,.scan,.flicker{animation:none}}
  </style>`;
}

export function industrialDefinitions(palette: Palette): string {
  return `<defs>
    <linearGradient id="industrial-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.background}"/><stop offset="1" stop-color="${palette.backgroundEnd}"/></linearGradient>
    <linearGradient id="industrial-accent" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${palette.primary}"/><stop offset="1" stop-color="${palette.secondary}"/></linearGradient>
    <pattern id="industrial-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${palette.grid}" stroke-width="1"/></pattern>
    <pattern id="industrial-dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="${palette.grid}"/></pattern>
    <filter id="industrial-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>`;
}

export function splitIndustrialHeadline(
  value: string,
): readonly [string, string] {
  const words = value.trim().split(/\s+/);
  if (words.length === 1) return [words[0] ?? "", ""];
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}
