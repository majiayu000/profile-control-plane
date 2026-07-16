#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { GitHubClient } from "./adapters/github.js";
import {
  loadProfileConfig,
  writeProfileConfig,
} from "./adapters/config-file.js";
import { writeCompiledProfile } from "./adapters/output.js";
import { startPreviewServer } from "./adapters/preview.js";
import { checkCompiledProfile } from "./application/checker.js";
import { compileProfile } from "./application/compiler.js";
import { createStarterConfig } from "./application/starter.js";
import { ProfileError, asProfileError } from "./core/errors.js";
import { assertProfileConfig } from "./config/schema.js";

function readPackageVersion(): string {
  const metadata: unknown = createRequire(import.meta.url)("../package.json");
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    !("version" in metadata) ||
    typeof metadata.version !== "string"
  ) {
    throw new Error("package.json is missing a string version");
  }
  return metadata.version;
}

const PACKAGE_VERSION = readPackageVersion();

function integer(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new InvalidArgumentError("must be an integer between 0 and 65535");
  }
  return parsed;
}

function repositoryLimit(value: string): number {
  const parsed = integer(value);
  if (parsed < 1 || parsed > 100)
    throw new InvalidArgumentError("must be an integer between 1 and 100");
  return parsed;
}

export function createProgram(): Command {
  const program = new Command()
    .name("profilectl")
    .description(
      "Compile a GitHub identity into a self-hosted profile control plane",
    )
    .version(PACKAGE_VERSION)
    .showHelpAfterError();

  program
    .command("init")
    .description(
      "Create a reviewed starter configuration from public GitHub metadata",
    )
    .argument("<username>", "GitHub username")
    .option("-o, --output <path>", "configuration path", "profile.yaml")
    .option(
      "--repo-limit <count>",
      "maximum repositories to inspect",
      repositoryLimit,
      100,
    )
    .option("--force", "replace an existing configuration", false)
    .action(
      async (
        username: string,
        options: { output: string; repoLimit: number; force: boolean },
      ) => {
        const token = process.env.GITHUB_TOKEN;
        const client = new GitHubClient(token ? { token } : {});
        const config = await assertProfileConfig(
          createStarterConfig(
            await client.snapshot(username, options.repoLimit),
          ),
        );
        await writeProfileConfig(options.output, config, options.force);
        process.stdout.write(
          `Created ${options.output}. Review labels and descriptions before building.\n`,
        );
      },
    );

  program
    .command("build")
    .description(
      "Compile a profile configuration into README.md and SVG assets",
    )
    .option("-c, --config <path>", "configuration path", "profile.yaml")
    .option("-o, --out <directory>", "output directory", ".profile-output")
    .option("--force", "replace an existing output directory", false)
    .action(
      async (options: { config: string; out: string; force: boolean }) => {
        const profile = compileProfile(await loadProfileConfig(options.config));
        await writeCompiledProfile(options.out, profile, options.force);
        process.stdout.write(
          `Built ${profile.files.length} files in ${options.out}.\n`,
        );
      },
    );

  program
    .command("preview")
    .description(
      "Serve an in-memory dark/light preview without writing generated files",
    )
    .option("-c, --config <path>", "configuration path", "profile.yaml")
    .option(
      "-p, --port <port>",
      "local port; use 0 for an available port",
      integer,
      4173,
    )
    .action(async (options: { config: string; port: number }) => {
      const preview = await startPreviewServer(
        compileProfile(await loadProfileConfig(options.config)),
        options.port,
      );
      process.stdout.write(`Preview: ${preview.url}\nPress Ctrl+C to stop.\n`);
      const close = (): void => {
        preview.server.close(() => process.exit(0));
      };
      process.once("SIGINT", close);
      process.once("SIGTERM", close);
    });

  program
    .command("check")
    .description(
      "Validate config, SVG XML, generated references, and optional online links",
    )
    .option("-c, --config <path>", "configuration path", "profile.yaml")
    .option(
      "--online",
      "also issue HEAD requests for profile links and flagship repositories",
      false,
    )
    .action(async (options: { config: string; online: boolean }) => {
      const config = await loadProfileConfig(options.config);
      const result = await checkCompiledProfile(
        config,
        compileProfile(config),
        { online: options.online },
      );
      process.stdout.write(
        `OK: ${result.fileCount} generated files; ${result.onlineUrlCount} online links checked.\n`,
      );
    });

  return program;
}

export async function run(argv = process.argv): Promise<void> {
  try {
    await createProgram().parseAsync(argv);
  } catch (error) {
    const expected = error instanceof ProfileError;
    const profileError = asProfileError(error);
    process.stderr.write(`[${profileError.code}] ${profileError.message}\n`);
    for (const detail of profileError.details ?? [])
      process.stderr.write(`  - ${detail}\n`);
    process.exitCode = expected ? 1 : 2;
  }
}

const entrypoint = process.argv[1];
if (
  entrypoint &&
  realpathSync(resolve(entrypoint)) ===
    realpathSync(fileURLToPath(import.meta.url))
)
  await run();
