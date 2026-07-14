import { lstat, mkdir, rename, rm, writeFile } from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  normalize,
  parse,
  resolve,
} from "node:path";
import { ProfileError } from "../core/errors.js";
import type { CompiledProfile } from "../core/types.js";

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") return false;
    throw error;
  }
}

async function cleanup(path: string): Promise<string | undefined> {
  try {
    await rm(path, { recursive: true, force: true });
    return undefined;
  } catch (error) {
    return `cleanup failed for ${path}: ${String(error)}`;
  }
}

function safeRelativePath(path: string): string {
  const normalized = normalize(path);
  if (
    isAbsolute(path) ||
    normalized === ".." ||
    normalized.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
  ) {
    throw new ProfileError(
      "OUTPUT_INVALID",
      `compiled file escapes output directory: ${path}`,
    );
  }
  return normalized;
}

export async function writeCompiledProfile(
  outputDirectory: string,
  profile: CompiledProfile,
  force = false,
): Promise<void> {
  const target = resolve(outputDirectory);
  const parent = dirname(target);
  const suffix = `${process.pid}-${Date.now()}`;
  const stage = join(parent, `.${basename(target)}.stage-${suffix}`);
  const backup = join(parent, `.${basename(target)}.backup-${suffix}`);

  if (
    target === resolve(".") ||
    target === parse(target).root ||
    (await exists(join(target, ".git")))
  ) {
    throw new ProfileError(
      "OUTPUT_INVALID",
      `refusing to replace protected output directory: ${target}; build into a dedicated generated directory`,
    );
  }

  try {
    await mkdir(parent, { recursive: true });
    if ((await exists(target)) && !force) {
      throw new ProfileError(
        "OUTPUT_EXISTS",
        `output directory already exists: ${target}; pass --force to replace it`,
      );
    }
    await mkdir(stage);
    for (const file of profile.files) {
      const destination = join(stage, safeRelativePath(file.path));
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, file.content, "utf8");
    }

    const targetExists = await exists(target);
    if (targetExists) await rename(target, backup);
    try {
      await rename(stage, target);
    } catch (error) {
      if (targetExists) await rename(backup, target);
      throw error;
    }
    if (targetExists) await rm(backup, { recursive: true, force: true });
  } catch (error) {
    const cleanupFailure = await cleanup(stage);
    if (error instanceof ProfileError) {
      if (!cleanupFailure) throw error;
      throw new ProfileError(error.code, error.message, [
        ...(error.details ?? []),
        cleanupFailure,
      ]);
    }
    throw new ProfileError(
      "OUTPUT_WRITE_FAILED",
      `could not write compiled profile: ${target}`,
      [String(error), ...(cleanupFailure ? [cleanupFailure] : [])],
    );
  }
}
