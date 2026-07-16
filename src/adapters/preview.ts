import { createServer, type Server } from "node:http";
import { ProfileError } from "../core/errors.js";
import { escapeXml } from "../core/escape.js";
import type { ColorMode, CompiledProfile, ThemePreset } from "../core/types.js";
import { getThemeDefinition } from "../themes/registry.js";

export interface PreviewServer {
  readonly server: Server;
  readonly url: string;
}

export interface TemplatePreview {
  readonly preset: ThemePreset;
  readonly profile: CompiledProfile;
}

function profilePage(prefix: string, mode: ColorMode): string {
  const otherMode = mode === "dark" ? "light" : "dark";
  const otherPath = otherMode === "dark" ? prefix || "/" : `${prefix}/light`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Profile Preview</title><style>:root{color-scheme:${mode}}body{margin:0;background:${mode === "dark" ? "#0d1117" : "#f6f8fa"};color:${mode === "dark" ? "#e6edf3" : "#1f2328"};font:14px ui-monospace,SFMono-Regular,Menlo,monospace}main{width:min(1200px,calc(100% - 32px));margin:24px auto}img{display:block;width:100%;margin:0 0 22px}a{color:${mode === "dark" ? "#58a6ff" : "#0969da"}}p{opacity:.72}</style></head><body><main><img src="${prefix}/assets/hero-${mode}.svg" alt="Hero preview"><img src="${prefix}/assets/closed-loop-${mode}.svg" alt="Overview preview"><p>${mode === "dark" ? "Dark" : "Light"} preview · <a href="${otherPath}">${otherMode} preview</a> · <a href="${prefix}/README.md">generated README</a>${prefix ? ' · <a href="/">all templates</a>' : ""}</p></main></body></html>`;
}

function comparisonPage(
  templates: readonly TemplatePreview[],
  mode: ColorMode,
): string {
  const cards = templates
    .map(({ preset }) => {
      const theme = getThemeDefinition(preset);
      const route = `/${preset}${mode === "light" ? "/light" : ""}`;
      return `<article><a class="preview" href="${route}"><img src="/${preset}/assets/hero-${mode}.svg" alt="${escapeXml(theme.label)} preview"></a><div><span>${escapeXml(theme.label)}</span><p>${escapeXml(theme.description)}</p><a href="${route}">Open full preview →</a></div></article>`;
    })
    .join("");
  const otherMode = mode === "dark" ? "light" : "dark";
  const otherPath = otherMode === "dark" ? "/" : "/light";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Choose a profile template</title><style>:root{color-scheme:${mode};--bg:${mode === "dark" ? "#0b0e11" : "#eef0ec"};--panel:${mode === "dark" ? "#171b20" : "#ffffff"};--text:${mode === "dark" ? "#f0f4f6" : "#182026"};--muted:${mode === "dark" ? "#96a2aa" : "#68747a"};--line:${mode === "dark" ? "#303840" : "#cbd2ce"};--accent:#00a7d1}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px "Avenir Next",Avenir,system-ui,sans-serif}main{width:min(1320px,calc(100% - 40px));margin:48px auto 72px}header{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:28px}h1{margin:0;font-size:clamp(32px,5vw,64px);letter-spacing:-.045em;line-height:.95}header p{max-width:520px;margin:10px 0 0;color:var(--muted)}header a,article div>a{color:var(--text);text-underline-offset:4px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,390px),1fr));gap:20px}article{overflow:hidden;border:1px solid var(--line);border-radius:22px;background:var(--panel);box-shadow:0 18px 50px rgba(0,0,0,.09);transition:transform .2s ease,border-color .2s ease}article:hover{transform:translateY(-4px);border-color:var(--accent)}.preview{display:block;padding:10px 10px 0}.preview img{display:block;width:100%;border-radius:14px}article div{padding:20px}article span{font-size:19px;font-weight:800}article p{min-height:44px;margin:8px 0 17px;color:var(--muted);line-height:1.5}@media(prefers-reduced-motion:reduce){article{transition:none}}@media(max-width:720px){main{margin-top:28px}header{display:block}header>a{display:inline-block;margin-top:16px}}</style></head><body><main><header><div><h1>Choose your profile.</h1><p>Same repositories, three distinct narratives. Compare first, then set <code>theme.preset</code> to the direction that fits.</p></div><a href="${otherPath}">View ${otherMode} mode</a></header><section class="grid">${cards}</section></main></body></html>`;
}

function profileRoutes(
  profile: CompiledProfile,
  prefix = "",
): Map<string, string> {
  return new Map(
    profile.files.map((file) => [`${prefix}/${file.path}`, file.content]),
  );
}

async function startRouteServer(
  routes: ReadonlyMap<string, string>,
  port: number,
): Promise<PreviewServer> {
  const server = createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const content = routes.get(pathname);
    if (content === undefined) {
      response
        .writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
        .end("Not found");
      return;
    }
    const contentType = pathname.endsWith(".svg")
      ? "image/svg+xml; charset=utf-8"
      : pathname.endsWith(".md")
        ? "text/markdown; charset=utf-8"
        : "text/html; charset=utf-8";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  }).catch((error: unknown) => {
    throw new ProfileError(
      "PREVIEW_FAILED",
      `could not start preview server on port ${port}`,
      [String(error)],
    );
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new ProfileError(
      "PREVIEW_FAILED",
      "preview server did not expose a TCP address",
    );
  }
  return { server, url: `http://127.0.0.1:${address.port}` };
}

export async function startPreviewServer(
  profile: CompiledProfile,
  port: number,
): Promise<PreviewServer> {
  const routes = profileRoutes(profile);
  routes.set("/", profilePage("", "dark"));
  routes.set("/light", profilePage("", "light"));
  return startRouteServer(routes, port);
}

export async function startTemplatePreviewServer(
  templates: readonly TemplatePreview[],
  port: number,
): Promise<PreviewServer> {
  if (templates.length === 0) {
    throw new ProfileError("PREVIEW_FAILED", "no templates to preview");
  }
  const presets = new Set(templates.map(({ preset }) => preset));
  if (presets.size !== templates.length) {
    throw new ProfileError("PREVIEW_FAILED", "duplicate template preview");
  }
  const routes = new Map<string, string>();
  for (const template of templates) {
    for (const [path, content] of profileRoutes(
      template.profile,
      `/${template.preset}`,
    ))
      routes.set(path, content);
    routes.set(
      `/${template.preset}`,
      profilePage(`/${template.preset}`, "dark"),
    );
    routes.set(
      `/${template.preset}/light`,
      profilePage(`/${template.preset}`, "light"),
    );
  }
  routes.set("/", comparisonPage(templates, "dark"));
  routes.set("/light", comparisonPage(templates, "light"));
  return startRouteServer(routes, port);
}
