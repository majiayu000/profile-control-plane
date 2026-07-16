import type { Palette } from "./palette.js";

export function controlPlaneStyle(): string {
  return `<style>
    text{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace}
    .label{font-size:12px;letter-spacing:3px;font-weight:700}.micro{font-size:10px;letter-spacing:2px}
    .flow{stroke-dasharray:7 9;animation:flow 8s linear infinite}.pulse{transform-box:fill-box;transform-origin:center;animation:pulse 2.4s ease-in-out infinite}
    .orbit{transform-box:fill-box;transform-origin:center;animation:orbit 24s linear infinite}.blink{animation:blink 2s ease-in-out infinite}.hot{animation:hot 3.2s ease-in-out infinite}
    @keyframes flow{to{stroke-dashoffset:-160}}@keyframes pulse{50%{opacity:.35;transform:scale(.72)}}
    @keyframes orbit{to{transform:rotate(360deg)}}@keyframes blink{50%{opacity:.35}}@keyframes hot{50%{opacity:.72}}
    @media(prefers-reduced-motion:reduce){.flow,.pulse,.orbit,.blink,.hot{animation:none}}
  </style>`;
}

export function controlPlaneDefinitions(palette: Palette): string {
  return `<defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.background}"/><stop offset="1" stop-color="${palette.backgroundEnd}"/></linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop stop-color="${palette.primary}"/><stop offset="1" stop-color="${palette.secondary}"/></linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${palette.grid}" stroke-width="1"/></pattern>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <marker id="loop-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8Z" fill="${palette.primary}"/></marker>
    <clipPath id="frame"><rect x="1" y="1" width="1198" height="358" rx="18"/></clipPath>
  </defs>`;
}
