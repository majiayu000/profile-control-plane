---
name: design-github-profile
description: Audit, design, generate, and safely stage an animated GitHub profile README with Profile Control Plane. Use when a user asks to improve a GitHub profile, turn repositories into a visual architecture story, generate dark/light profile SVGs, preview profile changes, or prepare a profile README branch without directly publishing to main.
---

# Design GitHub Profile

Turn a GitHub account into a reviewed profile system: factual repository data, human-meaningful architecture
labels, animated dark/light SVGs, and a safe preview branch.

## Workflow

1. Inspect before creating.
   - Locate the target `USERNAME/USERNAME` profile repository and any existing `README.md`, `assets/`, or
     `profile.yaml`.
   - Preserve existing user content until the generated result has been reviewed.
   - Locate `profilectl`; in this repository use `npm ci && npm run build` followed by `node dist/cli.js`.

2. Import factual metadata.
   - Run `profilectl init USERNAME --output profile.yaml` in a separate working directory.
   - If GitHub returns 403 due to public API limits, rerun with an existing `GITHUB_TOKEN` environment
     variable. Never print or write the token.
   - Do not continue after pagination, HTTP, parse, or schema errors.

3. Establish the architecture story.
   - Read the account profile plus README files for repositories being labeled.
   - Replace generic `SYSTEM 01` and `PROJECT 01` labels only when repository evidence supports the role.
   - Keep GitHub names, descriptions, links, languages, and stars factual. Leave uncertain descriptions blank.
   - Ask the user before making a semantic choice that materially changes their positioning.

4. Compile and validate.

   ```bash
   profilectl check --config profile.yaml
   profilectl build --config profile.yaml --out .profile-output
   profilectl preview --config profile.yaml
   ```

   - Inspect both `/` and `/light` in the preview.
   - Check headline wrapping, long repository names, node collisions, contrast, reduced-motion behavior, and
     every outbound link.
   - Use `profilectl check --online` only when network verification is appropriate.

5. Stage safely.
   - Create a new branch in the profile repository.
   - Copy only `.profile-output/README.md` and `.profile-output/assets/` into the profile repository.
   - Run `git diff --check`, inspect the full diff, and confirm no unrelated files changed.
   - Do not commit, push, open a pull request, or merge unless the user authorizes that specific action.
   - Never force-push and never replace a directory containing `.git`.

## Editing rules

- Treat `profile.yaml` as the authoring source; never hand-edit generated SVGs.
- Preserve dark and light variants together.
- Prefer one coherent system metaphor over a list of technologies.
- Keep the hero legible at GitHub's narrow mobile width.
- Do not add dynamic hosted widgets, tracking pixels, secrets, or scheduled jobs without explicit scope.
- If existing profile work is stronger in one section, retain it rather than forcing a full replacement.

## Done when

- `profilectl check` passes from the final config.
- The four SVGs are valid and reviewed in dark and light modes.
- The generated README references only files that will be staged.
- The preview branch diff contains no unrelated or secret material.
- Semantic labels are supported by repository evidence or explicitly approved by the user.
