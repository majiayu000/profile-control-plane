import { ProfileError } from "../core/errors.js";
import type { CompiledProfile, ProfileConfig } from "../core/types.js";
import { assertPublicHttpUrl } from "../core/url-policy.js";

const ONLINE_REQUEST_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

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

function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

async function fetchHeadWithRedirectPolicy(
  url: string,
  fetchImpl: typeof fetch,
  signal: AbortSignal,
): Promise<Response> {
  let current = assertPublicHttpUrl(url);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const response = await fetchImpl(current, {
      method: "HEAD",
      redirect: "manual",
      signal,
    });

    if (!isRedirectStatus(response.status)) return response;

    const location = response.headers.get("location");
    if (!location) {
      throw new Error(`${current} redirected without a Location header`);
    }

    let next: URL;
    try {
      next = new URL(location, current);
    } catch {
      throw new Error(`${current} redirected to an invalid Location`);
    }

    current = assertPublicHttpUrl(next.href);
  }

  throw new Error(`${url} exceeded ${MAX_REDIRECTS} redirects`);
}

async function assertOnlineUrls(
  urls: readonly string[],
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<void> {
  const failures: string[] = [];
  await Promise.all(
    urls.map(async (url) => {
      try {
        // Reject non-public hosts before any network I/O.
        assertPublicHttpUrl(url);
        const response = await fetchHeadWithRedirectPolicy(
          url,
          fetchImpl,
          AbortSignal.timeout(timeoutMs),
        );
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
    readonly onlineTimeoutMs?: number;
  } = {},
): Promise<CheckResult> {
  assertCompiledFiles(profile);
  const urls = options.online ? onlineUrls(config) : [];
  if (options.online)
    await assertOnlineUrls(
      urls,
      options.fetchImpl ?? fetch,
      options.onlineTimeoutMs ?? ONLINE_REQUEST_TIMEOUT_MS,
    );
  return { fileCount: profile.files.length, onlineUrlCount: urls.length };
}
