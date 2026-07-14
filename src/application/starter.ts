import { ProfileError } from "../core/errors.js";
import type {
  GitHubRepository,
  GitHubSnapshot,
  ProfileConfig,
} from "../core/types.js";

function repositoryRank(
  left: GitHubRepository,
  right: GitHubRepository,
): number {
  if (left.stargazers_count !== right.stargazers_count)
    return right.stargazers_count - left.stargazers_count;
  const pushed = (right.pushed_at ?? "").localeCompare(left.pushed_at ?? "");
  return pushed || left.name.localeCompare(right.name);
}

function normalizeWebsite(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function truncate(value: string, maximumLength: number): string {
  return value.length <= maximumLength
    ? value
    : `${value.slice(0, maximumLength - 1).trimEnd()}…`;
}

export function createStarterConfig(snapshot: GitHubSnapshot): ProfileConfig {
  const login = snapshot.profile.login;
  const repositories = snapshot.repositories
    .filter(
      (repo) =>
        repo.owner.login.toLowerCase() === login.toLowerCase() &&
        !repo.fork &&
        !repo.archived,
    )
    .sort(repositoryRank);

  if (repositories.length === 0) {
    throw new ProfileError(
      "GITHUB_PROFILE_EMPTY",
      `GitHub user ${login} has no eligible public source repositories; add at least one repository or author profile.yaml manually`,
    );
  }

  const top = repositories.slice(0, 8);
  const flagships = repositories.slice(0, 6);
  const grouped = new Map<string, GitHubRepository[]>();
  for (const repository of repositories) {
    const language = repository.language ?? "Other";
    const group = grouped.get(language) ?? [];
    group.push(repository);
    grouped.set(language, group);
  }
  const moduleGroups = [...grouped.entries()]
    .sort(
      (left, right) =>
        right[1].length - left[1].length || left[0].localeCompare(right[0]),
    )
    .slice(0, 8)
    .map(([name, projects]) => ({
      name,
      projects: projects.slice(0, 30).map((repository) => ({
        repo: repository.name,
        description: repository.description ?? "",
      })),
    }));
  const website = normalizeWebsite(snapshot.profile.blog);
  const links = [
    { label: "GitHub", url: snapshot.profile.html_url },
    ...(website ? [{ label: "Website", url: website }] : []),
  ];

  return {
    version: 1,
    github: { username: login },
    identity: {
      name: truncate(snapshot.profile.name?.trim() || login, 32),
      headline: "OPEN SOURCE SYSTEMS",
      tagline: snapshot.profile.bio ?? "",
      ...(snapshot.profile.location
        ? { location: truncate(snapshot.profile.location, 64) }
        : {}),
    },
    theme: {
      preset: "control-plane",
      primary: "#00A7D1",
      secondary: "#E84A8A",
    },
    links,
    layers: top.map((repository, index) => ({
      name: `SYSTEM ${String(index + 1).padStart(2, "0")}`,
      project: repository.name,
      description: repository.description ?? "",
      tone: index < Math.ceil(top.length / 2) ? "primary" : "secondary",
    })),
    flagships: flagships.map((repository, index) => ({
      repo: repository.name,
      role: `PROJECT ${String(index + 1).padStart(2, "0")}`,
      description: repository.description ?? "",
      tone: index % 2 === 0 ? "primary" : "secondary",
    })),
    module_groups: moduleGroups,
    settings: { show_stars: true, show_badges: true },
  };
}
