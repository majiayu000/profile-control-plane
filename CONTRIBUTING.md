# Contributing

Contributions are welcome when they keep the compiler deterministic, self-hosted, and safe for untrusted
GitHub metadata.

## Development loop

```bash
npm ci
npm run check
npm pack --dry-run
```

New behavior requires tests. The project enforces at least 80% coverage for lines, statements, functions,
and branches; security-sensitive output boundaries should be fully covered.

## Architecture rules

- Keep configuration validation in the JSON Schema and runtime validator.
- Keep renderers pure; filesystem, network, and preview effects belong in adapters.
- Escape values at the SVG, HTML, and Markdown boundary.
- Abort before writing if any generated asset is invalid.
- Never weaken assertions to make a build pass.
- Edit `examples/lifcc/profile.yaml`, then regenerate its output with the CLI; do not hand-edit generated SVGs.

Open an issue before adding a hosted service, required token, persistent store, automatic push, or breaking
schema change.
