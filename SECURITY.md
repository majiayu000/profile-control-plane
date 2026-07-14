# Security policy

## Supported versions

Security fixes are applied to the latest `0.1.x` release line until a stable release policy is published.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting for this repository. Do not open a public issue for a
suspected injection, secret exposure, path traversal, or unsafe overwrite flaw.

Include the affected command or API, a minimal configuration, expected behavior, and impact. Do not include
real access tokens or personal data.

## Security model

- GitHub metadata and YAML content are untrusted input.
- Unknown configuration fields are rejected.
- SVG is XML-validated and scanned for active content before writing.
- Markdown, HTML attributes, and SVG text are escaped at their output boundary.
- Builds stage complete output before replacement and reject protected directories.
- Tokens are optional, read from the environment for GitHub import, and never rendered.
- The project never commits, pushes, merges, changes profile pins, or modifies account settings.
