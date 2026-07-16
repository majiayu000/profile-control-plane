---
name: design-github-profile
description: Audit, position, design, generate, evaluate, and safely stage an evidence-backed GitHub profile README with Profile Control Plane. Use when a user asks to create, improve, redesign, or review a GitHub profile; choose a coherent profile story or archetype; turn repositories into credible proof; generate dark/light profile SVGs; or prepare a reviewed profile branch without directly publishing to main.
---

# Design GitHub Profile

Act as both a profile design lead and an evidence auditor. Establish who the profile is for and what its
repositories prove before selecting copy or visual structure. Use Profile Control Plane for deterministic
rendering after the user has reviewed the semantic positioning.

## Core contract

- Separate verified facts, evidence-supported interpretations, and user-authored intentions.
- Keep GitHub names, descriptions, links, languages, stars, and timestamps factual.
- Present positioning as a hypothesis when repositories support more than one credible story.
- Ask before applying a semantic choice that materially changes how the user is represented.
- Leave unsupported claims blank; never manufacture experience, impact, roles, metrics, or project purpose.
- Treat `profile.yaml` as the reviewed authoring source and the current JSON Schema as the capability boundary.
- Never write an undeclared theme preset or imply that a proposed visual direction is already renderable.

## Reference routing

- Read [evidence-and-positioning.md](references/evidence-and-positioning.md) when creating or materially
  changing the profile's audience, promise, headline, flagship selection, or repository roles.
- Read [archetypes.md](references/archetypes.md) when choosing a profile structure, comparing multiple
  credible narratives, or deciding whether the control-plane metaphor fits the account.
- Read [visual-and-content-guidelines.md](references/visual-and-content-guidelines.md) before rewriting copy,
  changing visual direction, or conducting the final dark/light and mobile review.
- Read [evaluation-rubric.md](references/evaluation-rubric.md) before declaring a redesigned profile ready to
  stage or publish.
- Skip references that do not apply when rebuilding an already approved `profile.yaml` without design changes.

## Workflow

1. Inspect before creating.
   - Locate the target `USERNAME/USERNAME` profile repository and any existing `README.md`, `assets/`, or
     `profile.yaml`.
   - Search for existing profile generators, workflows, and generated assets before adding new ones.
   - Preserve existing user content until the replacement has been reviewed.
   - Locate `profilectl`; in this repository run `npm ci && npm run build`, then use `node dist/cli.js`.

2. Import factual metadata.
   - Run `profilectl init USERNAME --output profile.yaml` in a separate working directory.
   - If GitHub returns 403 due to public API limits, rerun with an existing `GITHUB_TOKEN` environment
     variable. Never print or write the token.
   - Stop after pagination, HTTP, parse, or schema errors; do not continue with partial metadata.

3. Build the evidence inventory.
   - Read the account profile, existing profile README, and README files for likely flagship repositories.
   - Classify important statements using [evidence-and-positioning.md](references/evidence-and-positioning.md).
   - Exclude forks, archived experiments, duplicated projects, and stale work unless they are material to the
     user's intended story.

4. Establish the profile direction.
   - Produce one recommended design brief and at most one credible alternative.
   - State the audience, one-sentence promise, three strongest proofs, profile archetype, information order,
     visual direction, and content to omit.
   - Prefer the narrative best supported by current evidence, not the most fashionable visual style.
   - Recommend one supported template and explain why it fits the evidence. Treat the recommendation as
     guidance, not the user's final choice.
   - Obtain user approval before applying a material career, product, or identity positioning decision.

5. Translate the approved direction into the supported contract.
   - Keep one primary narrative; use a secondary archetype only to refine emphasis.
   - Replace generic `SYSTEM 01` and `PROJECT 01` labels only when repository evidence supports the role.
   - Use `layers` for a real sequence or system relationship, `flagships` for the strongest proof, and
     `module_groups` for meaningful supporting collections.
   - Inspect `schemas/profile.schema.json` before selecting a renderer preset. If the desired direction is not
     supported, do not invent a preset: either adapt it to a supported renderer with user approval or stop at
     the reviewed design brief and report the rendering gap.
   - When two or more presets remain credible, render the comparison page and let the user choose:

     ```bash
     profilectl preview --config profile.yaml --all-templates
     ```

   - Use `control-plane` for evidence of connected infrastructure or execution flow, `command-deck` for
     operations-heavy systems with a few mission-critical flagships, `signal-grid` for relationship-heavy
     networks, `editorial` for a curated body of authored work, `bento-grid` for distinct modular products,
     `terminal` for a CLI-and-tooling identity, `blueprint` for deliberate spec-driven engineering,
     `constellation` for a broad body of work with a few standout stars, and `metro` for many repositories
     that organize into clear language or domain lines (see the template table in
     `references/visual-and-content-guidelines.md`). Do not treat these as identity labels; repository
     evidence and user preference take precedence.

6. Compile and validate.

   ```bash
   profilectl check --config profile.yaml
   profilectl build --config profile.yaml --out .profile-output
   profilectl preview --config profile.yaml
   ```

   - Inspect both `/` and `/light` in the preview.
   - Check headline wrapping, long repository names, node collisions, contrast, reduced-motion behavior, and
     every outbound link.
   - Inspect remote image and badge URLs separately, including encoded owner and repository path segments;
     `check --online` does not prove that every embedded image contains the intended result.
   - Use `profilectl check --online` only when network verification is appropriate.

7. Evaluate profile quality.
   - Apply [evaluation-rubric.md](references/evaluation-rubric.md) to the rendered result and cite concrete
     evidence for each score.
   - Compare the candidate with the existing profile. Reject a generated replacement that loses stronger
     user-authored hierarchy, visuals, evidence, or accessibility.
   - Revise the profile when any category scores zero or the publication threshold is not met.
   - Do not use technical validity as a substitute for positioning clarity or visual quality.

8. Stage safely.
   - Create a new branch in the profile repository.
   - Copy only `.profile-output/README.md` and `.profile-output/assets/` into the profile repository.
   - Run `git diff --check`, inspect the full diff, and confirm no unrelated files changed.
   - Do not commit, push, open a pull request, or merge unless the user authorizes that specific action.
   - Never force-push and never replace a directory containing `.git`.

## Editing rules

- Never hand-edit generated SVGs.
- Preserve dark and light variants together.
- Prefer one coherent story over a technology list, badge wall, or collection of unrelated widgets.
- Keep the hero legible at GitHub's narrow mobile width.
- Do not add dynamic hosted widgets, tracking pixels, secrets, or scheduled jobs without explicit scope.
- Retain strong existing sections when they support the approved direction.
- Report evidence gaps and renderer limitations explicitly; do not silently degrade the result.

## Done when

- The user-approved direction is traceable to repository evidence.
- `profilectl check` passes from the final config.
- The four SVGs are valid and reviewed in dark and light modes.
- The quality rubric reaches its publication threshold with no zero category.
- The generated candidate does not regress any material quality category from the existing profile.
- The generated README references only files that will be staged.
- The preview branch diff contains no unrelated or secret material.
- The handoff identifies the chosen direction, supporting evidence, verification commands, and any remaining
  limitations.
