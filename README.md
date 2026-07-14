# Profile Control Plane

[![CI](https://github.com/majiayu000/profile-control-plane/actions/workflows/ci.yml/badge.svg)](https://github.com/majiayu000/profile-control-plane/actions/workflows/ci.yml)
[![MIT](https://img.shields.io/badge/license-MIT-00A7D1.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-E84A8A.svg)](package.json)

Compile a GitHub identity into an animated, dark/light, self-hosted profile README.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="examples/lifcc/output/assets/hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="examples/lifcc/output/assets/hero-light.svg">
  <img alt="Profile Control Plane example" src="examples/lifcc/output/assets/hero-light.svg" width="100%">
</picture>

Most profile generators render a banner or assemble remote widgets. Profile Control Plane treats your
repositories as one visual system: a hero, an execution path, a closed-loop architecture map, flagship
projects, and an expandable module registry—all generated from one reviewed YAML file.

## What you get

- One declarative `profile.yaml` as the authoring source of truth.
- Four animated SVGs with native dark/light variants and reduced-motion support.
- A generated GitHub-safe `README.md` with escaped metadata and optional star badges.
- `init`, `build`, `preview`, and `check` commands with typed, fail-closed errors.
- A bundled [`design-github-profile`](skills/design-github-profile/SKILL.md) agent skill.
- No hosted image API, database, analytics, or required token at render time.

## Quick start

The package is currently distributed from GitHub. Build and link the CLI locally:

```bash
git clone https://github.com/majiayu000/profile-control-plane.git
cd profile-control-plane
npm ci
npm link
```

Create a starter configuration from public GitHub metadata:

```bash
profilectl init YOUR_GITHUB_USERNAME
profilectl check
profilectl preview
```

Open the printed local URL, edit `profile.yaml` until the architecture tells the right story, then build:

```bash
profilectl build --out .profile-output
```

If the unauthenticated GitHub API is rate-limited, provide an existing token only for `init`:

```bash
GITHUB_TOKEN=your_token profilectl init YOUR_GITHUB_USERNAME
```

The token is read from the environment and is never written to the configuration or generated assets.

## Configuration

```yaml
version: 1
github:
  username: octocat
identity:
  name: Octocat
  headline: AGENT INFRASTRUCTURE
  tagline: Building the systems around coding agents.
theme:
  preset: control-plane
  primary: "#00A7D1"
  secondary: "#E84A8A"
layers:
  - name: DIRECT
    project: agent-cli
    description: The primary execution surface
    tone: primary
flagships:
  - repo: agent-cli
    role: EXECUTE
    description: A fast, inspectable coding agent.
    tone: primary
module_groups: []
settings:
  show_stars: true
  show_badges: true
```

The complete contract is [`schemas/profile.schema.json`](schemas/profile.schema.json). The starter importer
uses factual GitHub names, descriptions, languages, stars, and timestamps. It deliberately emits generic
`SYSTEM 01` / `PROJECT 01` labels because semantic architecture should be reviewed, not hallucinated.

See the curated [lifcc configuration](examples/lifcc/profile.yaml) and its [generated output](examples/lifcc/output/README.md).

## Commands

| Command                      | Purpose                                                                |
| ---------------------------- | ---------------------------------------------------------------------- |
| `profilectl init <username>` | Import public metadata into a reviewable starter config.               |
| `profilectl build`           | Compile README and SVGs into a dedicated output directory.             |
| `profilectl preview`         | Serve dark/light output from memory at `127.0.0.1`.                    |
| `profilectl check`           | Validate schema, generated XML, references, and optional online links. |

Use `--help` on any command for options. `build --force` refuses to replace the current directory, a
filesystem root, or any directory containing `.git`.

## Publish safely

Generated output is intentionally separate from your profile repository. On a new branch in the
`USERNAME/USERNAME` repository, copy only these files:

```text
.profile-output/README.md  -> README.md
.profile-output/assets/    -> assets/
```

Review the rendered branch and diff before merging. The CLI never commits, pushes, changes pins, or merges
to `main`.

## Agent skill

Copy the bundled skill into your agent skill directory, or reference it from this repository:

```bash
cp -R skills/design-github-profile ~/.codex/skills/
```

Then ask: `Use $design-github-profile to redesign my GitHub profile.` The skill audits existing profile
files, separates factual imports from semantic labels, validates both color modes, and prepares a preview
branch without publishing it.

## Design and safety

The compiler is pure: validated config goes in; static strings come out. Network and filesystem behavior
live in explicit adapters. SVG output is XML-validated and rejected if it contains script elements, event
attributes, or JavaScript URLs. Files are staged before an atomic directory replacement.

Read the [architecture foundation](docs/architecture.md), [security policy](SECURITY.md), and
[contribution guide](CONTRIBUTING.md) for details.

## Development

```bash
npm ci
npm run check
npm pack --dry-run
```

The test gate requires at least 80% line, statement, function, and branch coverage.

## License

[MIT](LICENSE) © lifcc
