import { ProfileError } from "../core/errors.js";
import type {
  GitHubProfile,
  GitHubRepository,
  GitHubSnapshot,
} from "../core/types.js";

export interface GitHubClientOptions {
  readonly token?: string;
  readonly fetchImpl?: typeof fetch;
  readonly apiBaseUrl?: string;
}

export class GitHubClient {
  readonly #fetch: typeof fetch;
  readonly #token: string | undefined;
  readonly #apiBaseUrl: string;

  constructor(options: GitHubClientOptions = {}) {
    this.#fetch = options.fetchImpl ?? fetch;
    this.#token = options.token;
    this.#apiBaseUrl = (options.apiBaseUrl ?? "https://api.github.com").replace(
      /\/$/,
      "",
    );
  }

  async snapshot(
    username: string,
    repositoryLimit = 100,
  ): Promise<GitHubSnapshot> {
    const profile = await this.#request<GitHubProfile>(
      `/users/${encodeURIComponent(username)}`,
    );
    const repositories: GitHubRepository[] = [];
    const perPage = Math.min(100, repositoryLimit);

    for (let page = 1; repositories.length < repositoryLimit; page += 1) {
      if (page > 100) {
        throw new ProfileError(
          "GITHUB_PAGINATION_FAILED",
          "GitHub repository pagination exceeded 100 pages",
        );
      }
      const batch = await this.#request<GitHubRepository[]>(
        `/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&page=${page}&sort=pushed&type=owner`,
      );
      repositories.push(...batch);
      if (batch.length < perPage) break;
    }

    return { profile, repositories: repositories.slice(0, repositoryLimit) };
  }

  async #request<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "profile-control-plane",
    };
    if (this.#token) headers.Authorization = `Bearer ${this.#token}`;

    let response: Response;
    try {
      response = await this.#fetch(`${this.#apiBaseUrl}${path}`, { headers });
    } catch (error) {
      throw new ProfileError(
        "GITHUB_REQUEST_FAILED",
        `GitHub request failed for ${path}`,
        [String(error)],
      );
    }
    if (!response.ok) {
      if (
        (response.status === 403 || response.status === 429) &&
        response.headers.get("x-ratelimit-remaining") === "0"
      ) {
        const reset = response.headers.get("x-ratelimit-reset");
        throw new ProfileError(
          "GITHUB_RATE_LIMITED",
          `GitHub API rate limit exhausted for ${path}`,
          [
            this.#token
              ? "the authenticated rate limit is exhausted; wait for the reset window"
              : "unauthenticated requests are limited to 60 per hour; set GITHUB_TOKEN to raise the limit",
            ...(reset ? [`the limit resets at unix time ${reset}`] : []),
          ],
        );
      }
      throw new ProfileError(
        "GITHUB_REQUEST_FAILED",
        `GitHub request returned HTTP ${response.status} for ${path}`,
      );
    }
    try {
      return (await response.json()) as T;
    } catch (error) {
      throw new ProfileError(
        "GITHUB_REQUEST_FAILED",
        `GitHub returned invalid JSON for ${path}`,
        [String(error)],
      );
    }
  }
}
