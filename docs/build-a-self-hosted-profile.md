# Build a GitHub profile README with local dark/light SVGs

Profile Control Plane compiles one reviewed YAML configuration into a README and
four SVG assets. Use it when you want the profile's images stored in your own
GitHub repository rather than rendered by a required hosted image API.

[Build and link the CLI](../README.md#quick-start) first. The following example
uses a checked-in configuration, so the compilation does not need a token or a
GitHub metadata import:

```bash
profilectl check --config examples/lifcc/profile.yaml
profilectl build --config examples/lifcc/profile.yaml --out .profile-output
```

This produces `README.md` and an `assets/` directory in `.profile-output`. It is
an example of lifcc's identity, not a profile to publish unchanged as your own.
Use a new output directory if that one already exists; review its contents before
choosing the explicit `--force` option to replace it.

## Create and review your own configuration

```bash
profilectl init YOUR_GITHUB_USERNAME
profilectl check --config profile.yaml
profilectl preview --config profile.yaml --all-templates --port 0
```

`init` reads public repository metadata. Review names, labels, descriptions, and
the selected projects in `profile.yaml`; generated starter labels are not a
verified architecture for your work. `--port 0` asks the preview server for an
available local port; open the printed URL and stop it with `Ctrl+C` when done.

The same configuration is previewed through all sixteen presets. Choose one
supported `theme.preset`, then build into a dedicated directory:

```bash
profilectl build --config profile.yaml --out .profile-output
```

Changing YAML and rebuilding is the authoring path. Hand-editing generated SVGs
will make future regeneration harder to review.

## Publish the README and all four SVGs together

GitHub shows a profile README from a public `USERNAME/USERNAME` repository under
[its profile README rules](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/managing-your-profile-readme).
On a branch in that repository, copy the generated README and **the whole assets
directory**, preserving their relative paths. Review the branch on GitHub in light
and dark appearances before merging.

The generated `<picture>` markup selects dark/light variants. If the hero is
missing, check that `assets/hero-dark.svg` and `assets/hero-light.svg` were copied
alongside the README and committed with the expected case. Copying only the README
leaves its relative image references unresolved.

The CLI does not create commits, push, pin repositories, or merge the profile.

## What does check verify?

The default `check` validates the configuration, generated SVG XML, and generated
file references locally. `check --online` additionally makes HEAD requests to
configured links and flagship repositories:

```bash
profilectl check --config profile.yaml --online
```

A blocked, unavailable, or rate-limited remote link can fail this optional check.
A successful local check does not prove external availability, indexing, ranking,
or what the GitHub profile looks like after publication.

The separate [GitHub Profile README Generator](https://github.com/rahuldkjain/github-profile-readme-generator)
documents a form-based authoring workflow with optional badges and widgets.
Profile Control Plane's workflow here is a YAML-to-static-assets compiler;
choose based on the authoring and output you need, not an unmeasured SEO claim.

[Configuration schema](../schemas/profile.schema.json) · [Commands](../README.md#commands) ·
[Architecture](architecture.md) · [Support](https://github.com/majiayu000/profile-control-plane/issues) ·
[License](../LICENSE)
