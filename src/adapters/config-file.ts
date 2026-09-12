import * as fs from "node:fs/promises";
import { dirname } from "node:path";
import { parse, stringify } from "yaml";
import { ProfileError } from "../core/errors.js";
import type { ProfileConfig } from "../core/types.js";
import { assertProfileConfig } from "../config/schema.js";

export async function loadProfileConfig(path: string): Promise<ProfileConfig> {
  let source: string;
  try {
    source = await fs.readFile(path, "utf8");
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT")
      throw new ProfileError(
        "CONFIG_NOT_FOUND",
        `configuration not found: ${path}`,
      );
    throw new ProfileError(
      "CONFIG_PARSE_FAILED",
      `could not read configuration: ${path}`,
      [String(error)],
    );
  }

  let value: unknown;
  try {
    value = parse(source);
  } catch (error) {
    throw new ProfileError(
      "CONFIG_PARSE_FAILED",
      `could not parse YAML: ${path}`,
      [String(error)],
    );
  }
  return assertProfileConfig(value);
}

async function writeAtomicTemp(
  temporaryPath: string,
  contents: string,
): Promise<void> {
  const handle = await fs.open(temporaryPath, "wx");
  try {
    await handle.writeFile(contents, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function writeProfileConfig(
  path: string,
  config: ProfileConfig,
  force = false,
): Promise<void> {
  const temporaryPath = `${path}.tmp-${process.pid}-${Date.now()}`;
  await fs.mkdir(dirname(path), { recursive: true });

  try {
    await writeAtomicTemp(temporaryPath, stringify(config, { lineWidth: 100 }));

    if (force) {
      await fs.rename(temporaryPath, path);
      return;
    }

    try {
      await fs.link(temporaryPath, path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") {
        throw new ProfileError(
          "CONFIG_EXISTS",
          `configuration already exists: ${path}; pass --force to replace it`,
        );
      }
      throw error;
    }
    await fs.rm(temporaryPath, { force: true });
  } catch (error) {
    await fs.rm(temporaryPath, { force: true });
    if (error instanceof ProfileError) throw error;
    throw new ProfileError(
      "OUTPUT_WRITE_FAILED",
      `could not write configuration: ${path}`,
      [String(error)],
    );
  }
}
