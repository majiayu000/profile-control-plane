# Profile archetypes

Use archetypes as information-architecture strategies, not personality labels or renderer names. Select the
primary archetype from evidence, then verify that the current compiler supports an appropriate presentation.

## Archetype selection

| Archetype              | Strong evidence signals                                                                             | Lead with                                                                 | Avoid when                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Systems builder        | Related infrastructure, CLI, platform, automation, or agent repositories form a real execution path | System boundary, flow, flagship components, operating principles          | Projects are unrelated or the sequence would be invented       |
| Product builder        | A small number of finished applications with clear users, screenshots, releases, or outcomes        | User problem, product promise, flagship products, proof of delivery       | Repositories are mostly libraries without a product surface    |
| Open-source maintainer | Sustained releases, adoption, contributors, issue stewardship, or ecosystem work                    | Maintained projects, community evidence, compatibility, current focus     | Impact is inferred only from repository count                  |
| Specialist             | Work clusters around a technical domain, method, research area, or deep craft                       | Area of expertise, representative work, methods, reproducible artifacts   | The account is intentionally broad or early evidence is sparse |
| Explorer               | Many credible experiments show a coherent set of questions or evolving interests                    | Exploration map, active themes, selected experiments, learning trajectory | It would excuse an uncurated repository dump                   |

## Composition rules

- Choose one primary archetype. Add at most one secondary influence to adjust tone or section order.
- Prefer the archetype that explains the strongest maintained repositories with the fewest unsupported claims.
- Do not equate profession with programming language. A TypeScript-heavy account is not automatically a
  frontend profile.
- Do not equate stars with identity. Popularity may support proof, but it does not define the user's intent.
- Do not force every repository into the story. Omission is part of the design.

## Information patterns

### Systems builder

Order the profile as identity, system promise, execution path, flagship components, architecture map, then
supporting modules. Use `layers` only for relationships that can be explained from repository evidence.

### Product builder

Order the profile as user problem, product promise, two or three finished products, outcomes or screenshots,
then supporting tools. Do not translate products into a fake infrastructure pipeline merely to fit a renderer.

### Open-source maintainer

Order the profile as maintenance focus, flagship projects, adoption or community evidence, compatibility and
support expectations, then current work. Avoid stale vanity metrics.

### Specialist

Order the profile as domain thesis, representative artifacts, methods, selected results, then a compact tool
index. Keep terminology understandable to the intended audience.

### Explorer

Order the profile as the central question, active exploration areas, selected experiments, and what is being
tested next. Curate aggressively and distinguish maintained work from archived experiments.

## Renderer boundary

Inspect `schemas/profile.schema.json` and the registered renderers before translating an archetype into
`profile.yaml`. Archetypes describe the story; they do not declare a supported `theme.preset`. When no
renderer fits, deliver the evidence-backed brief and explain the gap instead of inventing configuration or
forcing a misleading metaphor.
