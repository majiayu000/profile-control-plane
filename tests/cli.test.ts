import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execute = promisify(execFile);
const command = ["--import", "tsx", "src/cli.ts"];

describe("CLI process", () => {
  it("advertises the all-template comparison option", async () => {
    const result = await execute(process.execPath, [
      ...command,
      "preview",
      "--help",
    ]);
    expect(result.stdout).toContain("--all-templates");
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
