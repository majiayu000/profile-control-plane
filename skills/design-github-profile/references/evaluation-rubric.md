# Profile evaluation rubric

Apply this rubric to the final rendered profile before staging or recommending publication. Score the artifact,
not the intentions behind it, and cite visible evidence for every score.

## Scoring

Score each category from 0 to 2:

| Category              | 0                                                                               | 1                                                                     | 2                                                                                           |
| --------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Positioning clarity   | The first screen is generic or contradictory                                    | The focus emerges after reading several sections                      | The audience can identify who the user is and what they do within seconds                   |
| Evidence integrity    | Important claims are invented, unsupported, or misleading                       | Most claims are supported but some roles or emphasis remain ambiguous | Every material claim is factual, user-approved, or traceable to repository evidence         |
| Proof hierarchy       | Projects are missing, noisy, or equally weighted                                | Strong work is present but competes with secondary content            | The strongest two or three proofs dominate and support the headline                         |
| Narrative coherence   | Sections use unrelated metaphors or tell conflicting stories                    | Most sections align but some content feels inherited or incidental    | Copy, structure, repositories, and visual metaphor express one coherent direction           |
| Legibility and access | A mode, narrow width, reduced-motion state, or long-text case fails             | Minor visual issues remain without blocking comprehension             | Dark, light, narrow, reduced-motion, and boundary cases remain clear                        |
| Trust and maintenance | Hidden dependencies, stale widgets, secrets, or hand-edited output are required | The profile works but includes avoidable maintenance burden           | The result is self-hosted, reviewable, reproducible, and maintainable from declared sources |

Publication readiness requires at least 10 of 12 points and no zero category. A lower score is diagnostic, not
permission to weaken the rubric. Revise the profile or state why publication is not yet recommended.

## Review procedure

1. Open the generated preview in dark and light modes.
2. Inspect the first screen before reading repository details; record the apparent positioning.
3. Compare every visible claim and semantic label with the evidence inventory.
4. Inspect narrow-width rendering, long names, reduced motion, outbound links, and missing optional data.
5. Confirm the strongest repositories appear before supporting inventory.
6. Confirm the output can be regenerated from the reviewed `profile.yaml` without manual SVG edits.
7. Check the visible response of each remote badge or image; HTTP success alone is insufficient.
8. Score the existing profile and candidate with the same rubric; reject material regressions.
9. Revise any zero, publication-threshold failure, or regression.

## Handoff format

```text
Direction:
Primary audience:
Strongest evidence:
Rubric: X/12
Zero categories: none | list
Technical verification:
Remaining limitations:
Publication recommendation: ready | revise | blocked
```

Do not claim visual approval from schema checks or XML validation alone. Technical checks prove output
integrity; this rubric evaluates whether the profile communicates credibly and effectively.
