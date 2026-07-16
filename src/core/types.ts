export type Tone = "primary" | "secondary";
export type ColorMode = "dark" | "light";
export type ThemePreset =
  | "control-plane"
  | "editorial"
  | "bento-grid"
  | "terminal"
  | "blueprint"
  | "constellation"
  | "metro"
  | "command-deck"
  | "signal-grid";

export interface ProfileLink {
  readonly label: string;
  readonly url: string;
}

export interface ProfileLayer {
  readonly name: string;
  readonly project: string;
  readonly description: string;
  readonly tone: Tone;
}

export interface FlagshipProject {
  readonly repo: string;
  readonly role: string;
  readonly description: string;
  readonly tone: Tone;
}

export interface ModuleProject {
  readonly repo: string;
  readonly description: string;
}

export interface ModuleGroup {
  readonly name: string;
  readonly projects: readonly ModuleProject[];
}

export interface ProfileConfig {
  readonly version: 1;
  readonly github: { readonly username: string };
  readonly identity: {
    readonly name: string;
    readonly headline: string;
    readonly tagline: string;
    readonly location?: string;
  };
  readonly theme: {
    readonly preset: ThemePreset;
    readonly primary: string;
    readonly secondary: string;
  };
  readonly links?: readonly ProfileLink[];
  readonly layers: readonly ProfileLayer[];
  readonly flagships: readonly FlagshipProject[];
  readonly module_groups: readonly ModuleGroup[];
  readonly settings: {
    readonly show_stars: boolean;
    readonly show_badges: boolean;
  };
}

export interface CompiledFile {
  readonly path: string;
  readonly content: string;
}

export interface CompiledProfile {
  readonly files: readonly CompiledFile[];
}

export interface GitHubProfile {
  readonly login: string;
  readonly name: string | null;
  readonly bio: string | null;
  readonly location: string | null;
  readonly blog: string;
  readonly html_url: string;
}

export interface GitHubRepository {
  readonly name: string;
  readonly description: string | null;
  readonly html_url: string;
  readonly language: string | null;
  readonly stargazers_count: number;
  readonly fork: boolean;
  readonly archived: boolean;
  readonly pushed_at: string | null;
  readonly owner: { readonly login: string };
}

export interface GitHubSnapshot {
  readonly profile: GitHubProfile;
  readonly repositories: readonly GitHubRepository[];
}

export interface ThemeRenderer {
  renderHero(config: ProfileConfig, mode: ColorMode): string;
  renderLoop(config: ProfileConfig, mode: ColorMode): string;
}

export interface ThemeCopy {
  readonly flagshipHeading: string;
  readonly overviewHeading: string;
  readonly modulesHeading: string;
  readonly emptyModules: string;
  heroAlt(config: ProfileConfig): string;
  overviewAlt(config: ProfileConfig): string;
}

export interface ThemeDefinition {
  readonly preset: ThemePreset;
  readonly label: string;
  readonly description: string;
  readonly renderer: ThemeRenderer;
  readonly copy: ThemeCopy;
}
