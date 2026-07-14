import { describe, expect, it, vi } from "vitest";
import { GitHubClient } from "../src/adapters/github.js";
import { createStarterConfig } from "../src/application/starter.js";
import { assertProfileConfig } from "../src/config/schema.js";
import type { GitHubProfile, GitHubRepository } from "../src/core/types.js";
import { githubProfile, repository, snapshot } from "./fixtures.js";

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GitHub client", () => {
  it("fetches a profile and paginated repositories with optional authentication", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) =>
      repository({ name: `repo-${index}` }),
    );
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(json(githubProfile))
      .mockResolvedValueOnce(json(firstPage))
      .mockResolvedValueOnce(json([repository({ name: "last" })]));
    const result = await new GitHubClient({
      token: "secret",
      fetchImpl,
      apiBaseUrl: "https://unit.test/",
    }).snapshot("octocat", 101);
    expect(result.repositories).toHaveLength(101);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Record<
      string,
      string
    >;
    expect(headers.Authorization).toBe("Bearer secret");
    expect(fetchImpl.mock.calls[2]?.[0]).toContain("page=2");
  });

  it("reports HTTP, network, and JSON failures", async () => {
    await expect(
      new GitHubClient({
        fetchImpl: vi.fn().mockResolvedValue(new Response("", { status: 403 })),
      }).snapshot("x"),
    ).rejects.toMatchObject({ code: "GITHUB_REQUEST_FAILED" });
    await expect(
      new GitHubClient({
        fetchImpl: vi.fn().mockRejectedValue(new Error("offline")),
      }).snapshot("x"),
    ).rejects.toMatchObject({ code: "GITHUB_REQUEST_FAILED" });
    await expect(
      new GitHubClient({
        fetchImpl: vi.fn().mockResolvedValue(new Response("not json")),
      }).snapshot("x"),
    ).rejects.toMatchObject({ code: "GITHUB_REQUEST_FAILED" });
  });

  it("fails instead of returning partial data after the pagination ceiling", async () => {
    const fullPage = Array.from({ length: 100 }, (_, index) =>
      repository({ name: `repo-${index}` }),
    );
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(async (input) =>
        String(input).includes("/users/octocat/repos")
          ? json(fullPage)
          : json(githubProfile),
      );
    await expect(
      new GitHubClient({ fetchImpl }).snapshot("octocat", 10_001),
    ).rejects.toMatchObject({
      code: "GITHUB_PAGINATION_FAILED",
    });
  });
});

describe("starter configuration", () => {
  it("sorts owned source repositories, groups languages, and stays schema-valid", async () => {
    const repositories: GitHubRepository[] = [
      repository({
        name: "older",
        stargazers_count: 20,
        pushed_at: "2025-01-01T00:00:00Z",
        language: "Rust",
      }),
      repository({
        name: "newer",
        stargazers_count: 20,
        pushed_at: "2026-01-01T00:00:00Z",
        language: "Rust",
      }),
      repository({ name: "other", stargazers_count: 30, language: null }),
      repository({ name: "fork", fork: true, stargazers_count: 100 }),
      repository({ name: "archived", archived: true, stargazers_count: 100 }),
      repository({
        name: "foreign",
        owner: { login: "someone" },
        stargazers_count: 100,
      }),
    ];
    const config = createStarterConfig(snapshot(repositories));
    expect(config.layers.map((layer) => layer.project)).toEqual([
      "other",
      "newer",
      "older",
    ]);
    expect(config.module_groups.map((group) => group.name)).toEqual([
      "Rust",
      "Other",
    ]);
    expect(config.links?.at(1)?.url).toBe("https://example.com");
    await expect(assertProfileConfig(config)).resolves.toBe(config);
  });

  it("truncates visual identity fields and omits blank optional metadata", () => {
    const profile: GitHubProfile = {
      ...githubProfile,
      name: "N".repeat(80),
      bio: null,
      location: "L".repeat(100),
      blog: "",
    };
    const config = createStarterConfig({
      profile,
      repositories: [repository()],
    });
    expect(config.identity.name).toHaveLength(32);
    expect(config.identity.location).toHaveLength(64);
    expect(config.identity.tagline).toBe("");
    expect(config.links).toHaveLength(1);
  });

  it("rejects profiles without eligible repositories", () => {
    expect(() => createStarterConfig(snapshot([]))).toThrow(
      /no eligible public source repositories/,
    );
  });
});
