import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  loadProfileConfig,
  writeProfileConfig,
} from "../src/adapters/config-file.js";
import { assertProfileConfig } from "../src/config/schema.js";
import { ProfileError, asProfileError } from "../src/core/errors.js";
import { THEME_PRESETS } from "../src/themes/registry.js";
import { validConfig } from "./fixtures.js";

describe("profile schema", () => {
  it("accepts and deeply freezes a valid profile", async () => {
    const config = await assertProfileConfig(structuredClone(validConfig));
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.layers)).toBe(true);
  });

  it("rejects unknown fields and malformed values", async () => {
    await expect(
      assertProfileConfig({ ...validConfig, surprise: true }),
    ).rejects.toMatchObject({
      code: "CONFIG_INVALID",
    });
    await expect(
      assertProfileConfig({ ...validConfig, version: 2 }),
    ).rejects.toMatchObject({
      code: "CONFIG_INVALID",
    });
    await expect(
      assertProfileConfig({
        ...validConfig,
        theme: { ...validConfig.theme, preset: "unknown" },
      }),
    ).rejects.toMatchObject({ code: "CONFIG_INVALID" });
  });

  it("accepts every supported template preset", async () => {
    for (const preset of THEME_PRESETS) {
      await expect(
        assertProfileConfig({
          ...validConfig,
          theme: { ...validConfig.theme, preset },
        }),
      ).resolves.toMatchObject({ theme: { preset } });
    }
  });

  it("rejects duplicate case-insensitive identifiers", async () => {
    const duplicateLayer = {
      ...validConfig,
      layers: [
        validConfig.layers[0]!,
        { ...validConfig.layers[1]!, name: "direct" },
      ],
    };
    await expect(assertProfileConfig(duplicateLayer)).rejects.toMatchObject({
      code: "CONFIG_INVALID",
    });

    const duplicateFlagship = {
      ...validConfig,
      flagships: [
        validConfig.flagships[0]!,
        { ...validConfig.flagships[1]!, repo: "ALPHA" },
      ],
    };
    await expect(assertProfileConfig(duplicateFlagship)).rejects.toMatchObject({
      code: "CONFIG_INVALID",
    });
  });
});

describe("configuration files", () => {
  it("round-trips YAML and protects existing files", async () => {
    const root = await mkdtemp(join(tmpdir(), "profile-config-"));
    const path = join(root, "nested", "profile.yaml");
    await writeProfileConfig(path, validConfig);
    expect((await loadProfileConfig(path)).github.username).toBe("octocat");
    await expect(writeProfileConfig(path, validConfig)).rejects.toMatchObject({
      code: "CONFIG_EXISTS",
    });
    await writeProfileConfig(
      path,
      { ...validConfig, identity: { ...validConfig.identity, name: "New" } },
      true,
    );
    expect(await readFile(path, "utf8")).toContain("name: New");
  });

  it("reports missing, unreadable, malformed, and invalid files", async () => {
    const root = await mkdtemp(join(tmpdir(), "profile-config-errors-"));
    await expect(
      loadProfileConfig(join(root, "missing.yaml")),
    ).rejects.toMatchObject({ code: "CONFIG_NOT_FOUND" });
    await mkdir(join(root, "directory.yaml"));
    await expect(
      loadProfileConfig(join(root, "directory.yaml")),
    ).rejects.toMatchObject({ code: "CONFIG_PARSE_FAILED" });
    await writeFile(join(root, "broken.yaml"), "identity: [}");
    await expect(
      loadProfileConfig(join(root, "broken.yaml")),
    ).rejects.toMatchObject({ code: "CONFIG_PARSE_FAILED" });
    await writeFile(join(root, "invalid.yaml"), "version: 1\n");
    await expect(
      loadProfileConfig(join(root, "invalid.yaml")),
    ).rejects.toMatchObject({ code: "CONFIG_INVALID" });
  });
});

describe("typed errors", () => {
  it("preserves profile errors and wraps unknown values", () => {
    const known = new ProfileError("OUTPUT_INVALID", "bad", ["detail"]);
    expect(asProfileError(known)).toBe(known);
    expect(asProfileError(new Error("boom"))).toMatchObject({
      code: "UNEXPECTED",
      message: "boom",
    });
    expect(asProfileError("boom")).toMatchObject({
      code: "UNEXPECTED",
      message: "boom",
    });
  });
});
