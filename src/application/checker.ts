import { ProfileError } from "../core/errors.js";
import type { CompiledProfile, ProfileConfig } from "../core/types.js";

export interface CheckResult {
  readonly fileCount: number;
  readonly onlineUrlCount: number;
}

function assertCompiledFiles(profile: CompiledProfile): void {
  const paths = profile.files.map((file) => file.path);
  if (new Set(paths).size !== paths.length) {
    throw new ProfileError(
      "OUTPUT_INVALID",
      "compiled profile contains duplicate file paths",
    );
  }
  const readme = profile.files.find((file) => file.path === "README.md");
  if (!readme)
    throw new ProfileError(
      "OUTPUT_INVALID",
      "compiled profile is missing README.md",
    );
  for (const expected of [
    "hero-dark.svg",
    "hero-light.svg",
    "closed-loop-dark.svg",
    "closed-loop-light.svg",
  ]) {
    if (!readme.content.includes(`assets/${expected}`)) {
      throw new ProfileError(
        "OUTPUT_INVALID",
        `README.md does not reference assets/${expected}`,
      );
    }
  }
}

function onlineUrls(config: ProfileConfig): readonly string[] {
  const repositories = config.flagships.map(
    (project) =>
      `https://github.com/${config.github.username}/${encodeURIComponent(project.repo)}`,
  );
  return [
    ...new Set([
      ...(config.links?.map((link) => link.url) ?? []),
      ...repositories,
    ]),
  ].filter((url) => url.startsWith("http"));
}

async function assertOnlineUrls(
  urls: readonly string[],
  fetchImpl: typeof fetch,
): Promise<void> {
  const failures: string[] = [];
  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetchImpl(url, {
          method: "HEAD",
          redirect: "follow",
        });
        if (!response.ok)
          failures.push(`${url} returned HTTP ${response.status}`);
      } catch (error) {
        failures.push(`${url} failed: ${String(error)}`);
      }
    }),
  );
  if (failures.length > 0)
    throw new ProfileError(
      "OUTPUT_INVALID",
      "online link checks failed",
      failures,
    );
}

export async function checkCompiledProfile(
  config: ProfileConfig,
  profile: CompiledProfile,
  options: {
    readonly online?: boolean;
    readonly fetchImpl?: typeof fetch;
  } = {},
): Promise<CheckResult> {
  assertCompiledFiles(profile);
  const urls = options.online ? onlineUrls(config) : [];
  if (options.online) await assertOnlineUrls(urls, options.fetchImpl ?? fetch);
  return { fileCount: profile.files.length, onlineUrlCount: urls.length };
}
