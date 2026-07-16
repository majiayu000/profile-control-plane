# Architecture foundation

## Objective

Profile Control Plane compiles one declarative profile document into static,
self-hosted GitHub README assets. The compiler must be deterministic, safe for
untrusted GitHub metadata, usable without secrets, and testable without network
or browser access. Its bundled agent skill establishes an evidence-backed,
user-reviewed profile direction before compilation; design judgment never
expands the compiler's declared schema or renderer capabilities.

## Current evidence

| Area       | Evidence                                    | Implication                                             |
| ---------- | ------------------------------------------- | ------------------------------------------------------- |
| Entrypoint | One `profilectl` CLI                        | Commands remain thin application adapters.              |
| Core       | YAML data becomes SVG and Markdown          | Compilation can be a pure function.                     |
| Runtime    | One-shot developer tool                     | Use a streaming compile pipeline, not persistent state. |
| IO         | Filesystem, GitHub REST, local HTTP preview | Keep each behind an explicit adapter.                   |
| Config     | `profile.yaml` validated by JSON Schema     | Config is the only authoring source of truth.           |
| Errors     | Invalid output would be publicly visible    | Fail closed; never emit partial output.                 |
| Tests      | SVG, Markdown, long text, and IO boundaries | Use unit, golden, and CLI integration tests.            |

## Reference models considered

| Reference      | Borrow                       | Do not copy                             | Source                                      |
| -------------- | ---------------------------- | --------------------------------------- | ------------------------------------------- |
| GitHub Metrics | Generated self-hosted assets | Plugin count and token-heavy automation | https://github.com/lowlighter/metrics       |
| capsule-render | Parameterized SVG themes     | Hosted runtime dependency               | https://github.com/kyechan99/capsule-render |
| RepoVerse      | Projects as a visual system  | Fixed metaphor and scheduled generation | https://github.com/nimaldanyathk/repo-verse |

## Chosen shape

```text
product/app
  - cli.ts and commands/*
core/domain
  - config types, schema contract, typed errors
runtime/application
  - compiler.ts coordinates pure renderers
adapters/backends
  - config filesystem, GitHub REST, preview HTTP, output writer
plugins/components
  - themes/* behind a typed registry and the ThemeRenderer contract
testing/headless
  - fixtures, snapshots, fake GitHub responses, CLI integration
```

The loaded `ProfileConfig` is immutable compilation state. Pure renderers may
read it but cannot perform IO. Commands own effects and translate typed errors
into non-zero exit codes.

## Source of truth

| Contract                | Source                         | Consumers            | Rule                                         |
| ----------------------- | ------------------------------ | -------------------- | -------------------------------------------- |
| Public configuration    | `schemas/profile.schema.json`  | loader, docs, tests  | Types must match schema.                     |
| Runtime profile         | validated `ProfileConfig`      | compiler and theme   | No unvalidated object enters rendering.      |
| Theme catalog           | `src/themes/registry.ts`       | compiler and preview | Presets resolve to renderer and README copy. |
| Theme geometry          | `src/themes/*`                 | compiler             | Dark/light variants share geometry.          |
| Generated README/assets | compiler output                | writer and preview   | Generated files are never authoritative.     |
| Skill workflow          | `skills/design-github-profile` | Codex                | Skill positions and evaluates; CLI renders.  |

## Boundary contracts

| Contract      | Owner             | Allowed                          | Forbidden                       | Tests                           |
| ------------- | ----------------- | -------------------------------- | ------------------------------- | ------------------------------- |
| Config        | loader            | YAML, schema validation          | defaults that invent user data  | valid/invalid fixtures          |
| Compilation   | compiler          | pure config-to-files transform   | filesystem and network          | deterministic snapshots         |
| Theme         | renderer          | escaped strings and theme tokens | raw user HTML/XML               | injection and length tests      |
| GitHub import | GitHub adapter    | public REST, optional token      | silent partial pagination       | mocked pagination/errors        |
| Output        | writer            | atomic directory replacement     | partial file writes             | temporary-directory integration |
| Preview       | HTTP adapter      | selected or side-by-side output  | rebuilding with hidden defaults | route and comparison tests      |
| Publish       | external workflow | explicit user authorization      | implicit push to `main`         | Skill validation checklist      |

## Error policy

- Reject unknown fields, invalid colors, unsupported URLs, and oversized text.
- Escape every value inserted into SVG, HTML, or Markdown.
- Abort the build before writing when any renderer or validator fails.
- Treat GitHub pagination or HTTP failures as fatal during `init`.
- Print a typed error code and actionable message; do not warn and continue.

## Roadmap

| Priority | Work                                               | Done when                                     | Verification                     |
| -------- | -------------------------------------------------- | --------------------------------------------- | -------------------------------- |
| P0       | Schema, compiler, control-plane theme, build/check | Example produces four valid SVGs and README   | typecheck, tests, XML parse      |
| P1       | GitHub init, preview, guided design Skill          | Evidence-backed profile reaches preview       | mocked REST and Skill validation |
| P2       | Template registry and comparison preview           | All presets share one stable file contract    | compatibility and route fixtures |
| P3       | Additional validated templates and npm release     | New presets preserve schema and accessibility | visual and package verification  |

## Non-goals

- Hosting dynamic image APIs.
- Requiring a personal access token for public profiles.
- Automatically changing GitHub bio, pins, or `main`.
- Inferring semantic architecture labels without user or agent review.
