import type {
  GitHubProfile,
  GitHubRepository,
  GitHubSnapshot,
  ProfileConfig,
} from "../src/core/types.js";

export const validConfig: ProfileConfig = {
  version: 1,
  github: { username: "octocat" },
  identity: {
    name: "Octo Cat",
    headline: "AGENT INFRASTRUCTURE",
    tagline: "Building dependable systems.",
    location: "The Internet",
  },
  theme: { preset: "control-plane", primary: "#00A7D1", secondary: "#E84A8A" },
  links: [
    { label: "GitHub", url: "https://github.com/octocat" },
    { label: "Mail", url: "mailto:octocat@example.com" },
  ],
  layers: [
    {
      name: "DIRECT",
      project: "alpha",
      description: "First system",
      tone: "primary",
    },
    {
      name: "GOVERN",
      project: "beta",
      description: "Second system",
      tone: "secondary",
    },
  ],
  flagships: [
    {
      repo: "alpha",
      role: "ROUTE",
      description: "Routes requests",
      tone: "primary",
    },
    {
      repo: "beta",
      role: "TRUST",
      description: "Checks output",
      tone: "secondary",
    },
  ],
  module_groups: [
    {
      name: "Core",
      projects: [
        { repo: "alpha", description: "Routes requests" },
        { repo: "beta", description: "Checks output" },
      ],
    },
  ],
  settings: { show_stars: true, show_badges: true },
};

export const githubProfile: GitHubProfile = {
  login: "octocat",
  name: "The Octocat",
  bio: "GitHub mascot",
  location: "San Francisco",
  blog: "example.com",
  html_url: "https://github.com/octocat",
};

export function repository(
  overrides: Partial<GitHubRepository> = {},
): GitHubRepository {
  return {
    name: "alpha",
    description: "Alpha repository",
    html_url: "https://github.com/octocat/alpha",
    language: "TypeScript",
    stargazers_count: 10,
    fork: false,
    archived: false,
    pushed_at: "2026-01-01T00:00:00Z",
    owner: { login: "octocat" },
    ...overrides,
  };
}

export function snapshot(
  repositories: readonly GitHubRepository[] = [repository()],
): GitHubSnapshot {
  return { profile: githubProfile, repositories };
}
