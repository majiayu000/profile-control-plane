# Visual and content guidelines

Use these rules when translating an approved profile direction into copy, configuration, and rendered output.

## First-screen hierarchy

Make the first screen answer these questions in order:

1. Who is this person?
2. What do they build or maintain?
3. What concrete work proves it?

Keep the headline aligned with the flagship selection. Do not spend the highest-visibility area on greetings,
typing gimmicks, exhaustive technology lists, or generic enthusiasm.

## Copy

- Use concrete nouns and active verbs.
- Keep one claim per line or label.
- Prefer project purpose over implementation detail.
- Preserve official repository names and avoid unexplained internal jargon.
- Shorten copy rather than shrinking it until it is unreadable.
- Make labels distinct when scanned without their descriptions.
- Omit empty sections instead of adding placeholder prose.

## Repository selection

- Put the strongest two or three proofs before the complete module inventory.
- Prefer maintained source repositories over forks, mirrors, archived experiments, or configuration dumps.
- Include a less popular repository when it is more representative of the approved positioning.
- Group supporting projects by real purpose or domain, not merely by programming language, when evidence
  supports the semantic grouping.

## Visual system

- Use one layout metaphor, one type hierarchy, and a restrained accent system.
- Treat custom colors as inputs that still require contrast review in both modes.
- Preserve dark and light variants together; neither is secondary.
- Keep essential text legible at narrow GitHub widths and without animation.
- Use motion to explain flow or state, not as continuous decoration.
- Respect `prefers-reduced-motion` and verify the static state remains meaningful.
- Avoid collisions, clipped labels, tiny repository names, and diagrams that require hover interaction.

### Supported template directions

| Preset           | Prefer when the evidence shows                               | Reject when                                     |
| ---------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| `control-plane`  | Connected systems, infrastructure, orchestration, flow       | The repositories do not form an explainable map |
| `command-deck`   | Operational systems with a few mission-critical flagships    | The work lacks a clear execution hierarchy      |
| `signal-grid`    | Projects whose relationships and shared signals matter       | The projects are mostly independent             |
| `editorial`      | A curated body of authored or maintained work                | The account needs dense product comparison      |
| `bento-grid`     | Distinct products or modules that deserve equal scanning     | The work is one continuous system narrative     |
| `terminal`       | CLI tools, shells, daemons, a hands-on-keyboard identity     | The audience is non-technical or design-first   |
| `blueprint`      | Deliberate engineering, specs, protocols, hardware           | The work is exploratory or artistic in nature   |
| `constellation`  | A broad body of related work with a few standout stars       | Repositories need dense technical comparison    |
| `metro`          | Many repositories organized into clear language/domain lines | The account has few repositories or one domain  |
| `monolith`       | A focused body of work with a strong central thesis          | The work needs dense comparison or soft tone    |
| `interlace`      | Projects connect across disciplines, layers, or shared craft | The projects are unrelated independent products |
| `cipher-print`   | Precision, stewardship, and craft are part of the evidence   | The audience needs a casual or playful tone     |
| `field-specimen` | Exploratory or branching work benefits from classification   | The work is one linear operational pipeline     |
| `patchbay`       | Tools and projects wired into one routed signal path         | The projects share no interfaces or flow        |
| `cartograph`     | The work spans domains that benefit from orientation         | The account is a single focused product         |
| `foundry`        | Hardened, durable tools are cast and shipped                 | The work is exploratory or unshipped            |

Recommend the strongest evidence fit, then use the all-template preview when another direction remains
credible. The user's explicit visual preference overrides the recommendation as long as it does not require
unsupported claims or an undeclared preset.

## External content

- Prefer generated, self-hosted assets.
- Add hosted widgets only when explicitly requested and when their availability, privacy, and maintenance
  tradeoffs are acceptable.
- Inspect the rendered content of remote badges, not only their HTTP status. A badge service can return a
  successful error image for a malformed owner or repository path.
- Do not add tracking pixels, visitor counters, secret-bearing URLs, or unreviewed third-party scripts.
- Keep badges subordinate to evidence; a badge wall is not information architecture.

## Preservation

Retain existing biography, artwork, links, or sections when they are accurate, distinctive, and compatible
with the approved direction. Redesign only what needs to change. Never replace stronger user-authored work
merely to make every profile conform to the generator.

Compare the existing and generated candidates before staging. Preserve the existing artifact when the
compiler cannot reproduce its stronger hierarchy, visual system, or semantics; report that renderer gap
instead of treating generated output as automatically preferable.

## Common failure modes

- A headline broad enough to fit every developer.
- A system diagram whose relationships cannot be explained.
- Every repository presented as equally important.
- Visual polish masking weak or fabricated positioning.
- Dark mode reviewed while light mode is assumed to work.
- Desktop SVGs that become unreadable in the GitHub mobile layout.
- A technically valid README that the user cannot maintain from `profile.yaml`.
