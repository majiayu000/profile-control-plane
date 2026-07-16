import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
import { writeCompiledProfile } from "../src/adapters/output.js";
import {
  startPreviewServer,
  startTemplatePreviewServer,
  type PreviewServer,
} from "../src/adapters/preview.js";
import { checkCompiledProfile } from "../src/application/checker.js";
import { compileProfile } from "../src/application/compiler.js";
import type { CompiledProfile } from "../src/core/types.js";
import { THEME_PRESETS } from "../src/themes/registry.js";
import { validConfig } from "./fixtures.js";

const servers: PreviewServer[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (preview) =>
        new Promise<void>((resolve) => {
          preview.server.close(() => resolve());
        }),
    ),
  );
});

describe("atomic output writer", () => {
  it("writes nested files, protects output, and atomically replaces with force", async () => {
    const root = await mkdtemp(join(tmpdir(), "profile-output-"));
    const output = join(root, "generated");
    const profile = compileProfile(validConfig);
    await writeCompiledProfile(output, profile);
    expect(await readFile(join(output, "README.md"), "utf8")).toContain(
      "Flagship systems",
    );
    await expect(writeCompiledProfile(output, profile)).rejects.toMatchObject({
      code: "OUTPUT_EXISTS",
    });
    const replacement: CompiledProfile = {
      files: [{ path: "README.md", content: "replacement" }],
    };
    await writeCompiledProfile(output, replacement, true);
    expect(await readFile(join(output, "README.md"), "utf8")).toBe(
      "replacement",
    );
  });

  it("rejects paths outside the output and wraps filesystem failures", async () => {
    const root = await mkdtemp(join(tmpdir(), "profile-output-errors-"));
    await expect(
      writeCompiledProfile(join(root, "out"), {
        files: [{ path: "../escape.txt", content: "bad" }],
      }),
    ).rejects.toMatchObject({ code: "OUTPUT_INVALID" });
    const blocker = join(root, "blocker");
    await writeFile(blocker, "file");
    await expect(
      writeCompiledProfile(join(blocker, "out"), { files: [] }),
    ).rejects.toMatchObject({
      code: "OUTPUT_WRITE_FAILED",
    });
  });

  it("refuses to replace a Git repository or the current working directory", async () => {
    const root = await mkdtemp(join(tmpdir(), "profile-output-protected-"));
    await mkdir(join(root, ".git"));
    await expect(
      writeCompiledProfile(root, { files: [] }, true),
    ).rejects.toMatchObject({ code: "OUTPUT_INVALID" });
    await expect(
      writeCompiledProfile(".", { files: [] }, true),
    ).rejects.toMatchObject({ code: "OUTPUT_INVALID" });
  });
});

describe("compiled profile checker", () => {
  it("accepts generated output and checks unique online URLs", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("", { status: 200 }));
    const result = await checkCompiledProfile(
      validConfig,
      compileProfile(validConfig),
      { online: true, fetchImpl },
    );
    expect(result).toEqual({ fileCount: 5, onlineUrlCount: 3 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("rejects duplicate paths, missing README, missing references, and broken links", async () => {
    await expect(
      checkCompiledProfile(validConfig, {
        files: [
          { path: "x", content: "" },
          { path: "x", content: "" },
        ],
      }),
    ).rejects.toThrow(/duplicate/);
    await expect(
      checkCompiledProfile(validConfig, { files: [] }),
    ).rejects.toThrow(/missing README/);
    await expect(
      checkCompiledProfile(validConfig, {
        files: [{ path: "README.md", content: "" }],
      }),
    ).rejects.toThrow(/does not reference/);
    await expect(
      checkCompiledProfile(validConfig, compileProfile(validConfig), {
        online: true,
        fetchImpl: vi.fn().mockResolvedValue(new Response("", { status: 404 })),
      }),
    ).rejects.toMatchObject({ code: "OUTPUT_INVALID" });
    await expect(
      checkCompiledProfile(validConfig, compileProfile(validConfig), {
        online: true,
        fetchImpl: vi.fn().mockRejectedValue(new Error("offline")),
      }),
    ).rejects.toMatchObject({ code: "OUTPUT_INVALID" });
  });
});

describe("preview server", () => {
  it("serves dark/light previews, generated files, HEAD, 404, and 405", async () => {
    const preview = await startPreviewServer(compileProfile(validConfig), 0);
    servers.push(preview);
    expect(await (await fetch(preview.url)).text()).toContain("hero-dark.svg");
    expect(await (await fetch(`${preview.url}/light`)).text()).toContain(
      "hero-light.svg",
    );
    expect(
      (await fetch(`${preview.url}/assets/hero-dark.svg`)).headers.get(
        "content-type",
      ),
    ).toContain("image/svg+xml");
    expect(
      (await fetch(`${preview.url}/README.md`, { method: "HEAD" })).status,
    ).toBe(200);
    expect((await fetch(`${preview.url}/missing`)).status).toBe(404);
    expect((await fetch(preview.url, { method: "POST" })).status).toBe(405);
  });

  it("reports occupied ports", async () => {
    const first = await startPreviewServer(compileProfile(validConfig), 0);
    servers.push(first);
    const port = Number(new URL(first.url).port);
    await expect(
      startPreviewServer(compileProfile(validConfig), port),
    ).rejects.toMatchObject({ code: "PREVIEW_FAILED" });
  });

  it("serves a comparison gallery and namespaced template previews", async () => {
    const templates = THEME_PRESETS.map((preset) => {
      const config = {
        ...validConfig,
        theme: { ...validConfig.theme, preset },
      };
      return { preset, profile: compileProfile(config) };
    });
    const preview = await startTemplatePreviewServer(templates, 0);
    servers.push(preview);
    const gallery = await (await fetch(preview.url)).text();
    expect(gallery).toContain("Choose your profile");
    expect(gallery).toContain("/editorial/assets/hero-dark.svg");
    expect(await (await fetch(`${preview.url}/light`)).text()).toContain(
      "hero-light.svg",
    );
    expect(
      await (await fetch(`${preview.url}/bento-grid/light`)).text(),
    ).toContain("/bento-grid/assets/closed-loop-light.svg");
    expect((await fetch(`${preview.url}/editorial/README.md`)).status).toBe(
      200,
    );
  });

  it("rejects empty and duplicate template comparisons", async () => {
    await expect(startTemplatePreviewServer([], 0)).rejects.toMatchObject({
      code: "PREVIEW_FAILED",
    });
    const profile = compileProfile(validConfig);
    await expect(
      startTemplatePreviewServer(
        [
          { preset: "control-plane", profile },
          { preset: "control-plane", profile },
        ],
        0,
      ),
    ).rejects.toMatchObject({ code: "PREVIEW_FAILED" });
  });
});
