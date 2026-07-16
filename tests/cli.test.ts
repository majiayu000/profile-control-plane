import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execute = promisify(execFile);
const command = ["--import", "tsx", "src/cli.ts"];

describe("CLI process", () => {
  it("reports the package version", async () => {
    const metadata: unknown = JSON.parse(
      await readFile("package.json", "utf8"),
    );
    if (
      typeof metadata !== "object" ||
      metadata === null ||
      !("version" in metadata) ||
      typeof metadata.version !== "string"
    ) {
      throw new Error("package.json is missing a string version");
    }

    const result = await execute(process.execPath, [...command, "--version"]);
    expect(result.stdout.trim()).toBe(metadata.version);
    expect(result.stderr).toBe("");
  });

  it("checks a valid profile and prints the result", async () => {
    const result = await execute(process.execPath, [
      ...command,
      "check",
      "--config",
      "examples/lifcc/profile.yaml",
    ]);
    expect(result.stdout).toContain("OK: 5 generated files");
    expect(result.stderr).toBe("");
  });

  it("returns a typed non-zero error for missing configuration", async () => {
    await expect(
      execute(process.execPath, [
        ...command,
        "check",
        "--config",
        "missing-profile.yaml",
      ]),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("[CONFIG_NOT_FOUND]"),
    });
  });
});
