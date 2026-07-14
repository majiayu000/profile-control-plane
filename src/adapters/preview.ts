import { createServer, type Server } from "node:http";
import { ProfileError } from "../core/errors.js";
import type { CompiledProfile } from "../core/types.js";

export interface PreviewServer {
  readonly server: Server;
  readonly url: string;
}

const previewHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Profile Control Plane Preview</title><style>body{margin:0;background:#07131a;color:#dceef4;font:14px ui-monospace,monospace}main{width:min(1200px,calc(100% - 32px));margin:24px auto}img{display:block;width:100%;margin:0 0 22px}a{color:#54d8f4}p{color:#8ba9b5}</style></head><body><main><img src="/assets/hero-dark.svg" alt="Hero preview"><img src="/assets/closed-loop-dark.svg" alt="Architecture preview"><p>Dark preview · <a href="/light">light preview</a> · <a href="/README.md">generated README</a></p></main></body></html>`;
const lightPreviewHtml = previewHtml
  .replace(
    "background:#07131a;color:#dceef4",
    "background:#f6fbfd;color:#102934",
  )
  .replaceAll("-dark.svg", "-light.svg")
  .replace(
    'Dark preview · <a href="/light">light preview</a>',
    'Light preview · <a href="/">dark preview</a>',
  );

export async function startPreviewServer(
  profile: CompiledProfile,
  port: number,
): Promise<PreviewServer> {
  const files = new Map(
    profile.files.map((file) => [`/${file.path}`, file.content]),
  );
  const server = createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const content =
      pathname === "/"
        ? previewHtml
        : pathname === "/light"
          ? lightPreviewHtml
          : files.get(pathname);
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
