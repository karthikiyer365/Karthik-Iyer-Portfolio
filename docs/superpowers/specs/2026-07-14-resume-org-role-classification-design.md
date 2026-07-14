# Design: Org-industry + role-type classification for the resume-chat pipeline

**Date:** 2026-07-14
**Branch:** hotifx
**Context manifest:** `.claude/context/resume-org-role-classification.md`

## Problem

The resume-chat pipeline (`/api/resume/questions`, `/api/resume/generate`) already runs a script-only, zero-LLM-cost keyword scorer (`analyzeJd` in `server/ai/keywordMatch.ts`) that produces a technical "archetype" (`streaming-DE`/`batch-DE`/`ml-adjacent`/`cloud-infra-DE`/`analytics-DE`) fed internally into both prompts. It's DE-flavor-only and has no concept of the hiring org's industry.

We want two classifications per pasted JD:
1. **Industry vertical** the hiring org is in (e.g. tech, finance, logistics)
2. **Role-type flavor** the JD is asking for (e.g. ETL-heavy, BI-focus, project-management)

Both should bias how bullets are worded, and — per this design — also nudge the layout pick (A/B/C/D) and skills-group ordering. Everything stays internal (never shown to the recruiter), consistent with the existing gap-score's treatment.

## Role-type taxonomy (replaces `ARCHETYPES`)

Same keyword-regex-scoring mechanism as today, relabeled and reshaped around Karthik's actual work, with one new bucket:

| Key | Signals (merged/renamed from existing `ARCHETYPES`) |
|-|-|
| `etl-de` | union of old `streaming-DE` + `batch-DE` signals (kafka, kinesis, flink, spark, glue, airflow, etl, elt, dbt, batch processing, real-time, cdc, hive, hadoop, emr, dagster, prefect, ...) |
| `bi-analytics` | old `analytics-DE` signals (dbt, snowflake, tableau, power bi, looker, bigquery, duckdb, quicksight, superset, grafana, data warehouse, data lakehouse, redshift) |
| `ai-ml` | old `ml-adjacent` signals (sagemaker, mlflow, feature store, machine learning, pytorch, tensorflow, llm, rag, vertex ai, xgboost, scikit-learn, embeddings, fine-tuning) |
| `cloud-infra` | old `cloud-infra-DE` signals (eks, k8s, kubernetes, terraform, cdk, cloudformation, docker, helm, ecs, ansible, ci/cd, github actions, cloudwatch, observability) |
| `project-management` | **NEW**: stakeholder management, roadmap, cross-functional, scrum master, program management, sprint planning, backlog, agile ceremonies, okr, prioritization, delivery management, product owner |

Always computed synchronously via keyword scoring — same cost profile as today (zero LLM tokens). `streaming-DE` and `batch-DE` collapsing into one `etl-de` bucket is a deliberate simplification: the distinction rarely changes how a bullet gets worded, and Karthik's real experience doesn't cleanly split along that line.

## Industry taxonomy (new)

Fixed label set, used directly by the keyword method and preferred (but not hard-enforced) by the LLM method for comparability:

```
tech · finance · logistics/supply-chain · sports · edutech ·
insurance/proptech · retail/e-commerce · consulting · other/unclassified
```

**Design constraint — domain vocabulary, not role vocabulary.** Every JD Karthik pastes is inherently for a developer/analytics/data role — that's already captured by the separate role-type axis. Industry signals must therefore be *what the company/domain is about* (the objects, systems, and processes of that industry), never role-level terms ("engineer", "developer", "analyst" tell you nothing about industry and would false-match everywhere). A logistics-company JD for a data engineer will say "TMS", "fleet telemetry", "freight brokerage", "route optimization" — not "warehouse worker" or "forklift" (those are ops-role terms for a role Karthik doesn't target, and would never appear in a *data* JD anyway, but including them would still be the wrong kind of signal). Same logic applies to every bucket: sports means "sports analytics" data-domain terms, not "athletic trainer" role terms; insurance/proptech means "claims data", "underwriting models", not "claims adjuster".

Signal keyword lists per bucket (illustrative, refined during implementation — all chosen as domain-object terms likely to appear in a *technical* JD at that kind of company):
- **tech**: saas platform, developer platform, api-first, product analytics, internal tooling
- **finance**: trading systems, portfolio data, fintech, lending platform, underwriting models, risk data, hedge fund, brokerage systems
- **logistics/supply-chain**: fleet telemetry, freight brokerage, tms, wms, route optimization, supply chain visibility, last-mile, distribution network, inventory forecasting
- **sports**: sports analytics, player tracking data, league operations data, team performance metrics, sports betting data
- **edutech**: lms platform, curriculum data, student outcomes, online learning platform, ed-tech
- **insurance/proptech**: claims data, underwriting models, property data, restoration operations data, construction data, real estate platform, procore, policy data — maps directly to Karthik's RestoreFast experience
- **retail/e-commerce**: e-commerce platform, checkout systems, merchandising data, storefront analytics, marketplace data, sku-level data
- **consulting**: client engagement data, professional services delivery, advisory analytics
- **other/unclassified**: fallback when no bucket scores above zero

## A/B toggle: keyword vs. LLM industry classification

No analytics/DB infra exists in this repo, so the "A/B test" is an env-var toggle you flip manually between test batches, comparing via server logs — not a live randomized split.

```
RESUME_INDUSTRY_CLASSIFIER=keyword   (default, unset falls back to this)
RESUME_INDUSTRY_CLASSIFIER=llm
```

- **`keyword`** (default): same regex-scoring mechanism as role-type, sync, zero extra latency/cost.
- **`llm`**: one additional `callOpenRouterChat` call, low `max_tokens` (~30), `temperature: 0`, system prompt constrained to pick one of the 9 industry labels from the JD text. The prompt explicitly states the same domain-vocabulary constraint above (every JD is for a technical/data role — classify the *company's* industry from what it does, not from the role's title) so the LLM path can't drift toward role-based guessing the keyword path is designed to avoid. Runs *before* the main prompt is built — same pipeline position as the keyword path, so both produce an identical `{ industry: string, method: "keyword" | "llm" }` shape for apples-to-apples comparison.
- Role-type is **never** A/B tested — it stays keyword-only, matching the existing validated `ARCHETYPES` pattern.
- Every resolved classification (`roleType`, `industry`, `method`) is `console.log`'d in both routes, so flipping the env var between dev-server runs and pasting the same test JDs lets you eyeball agreement/quality by hand.

## Prompt integration

Both `/api/resume/questions/route.ts` and `/api/resume/generate/route.ts` already share one injection point: `formatReport(gap)` interpolated into the system prompt. This is extended, not duplicated:

- `formatReport()` gains a `Role-type: <key> [<top signals>]` line (renamed from today's `Archetype:` line) and an `Industry: <label> (<method>)` line.
- `generate/route.ts` system prompt gets one new instruction sentence: use role-type + industry to bias which tools/phrases get emphasized in bullet wording (still bound by the existing `BULLET_RULES` — no new facts, no invention).
- **Layout rule** (today's `LAYOUT DECISION` block, A/B/C/D) gets one added clause: role-type/industry is one factor in the pick — e.g. a `project-management`-flavored JD leans toward layout D (experience/tenure-heavy).
- **Skills-group rule** relaxed: today's prompt hard-locks the 5 skill groups (`"Languages & Data", "Data Engineering", "AI / ML", "Cloud & DevOps", "BI & Visualization"`) to always appear in that exact order. New rule: same 5 groups, always present, but the group most aligned with the resolved role-type is ordered first (e.g. `bi-analytics` → "BI & Visualization" leads).

`questions/route.ts` gets the same `Role-type:`/`Industry:` lines injected via the shared `formatReport()` call, so the clarifying questions it generates can also lean on the signal (no separate prompt-writing needed there).

## Visibility

Stays fully internal — never surfaced in the chat UI or the generated resume, consistent with `docs/resume-chat.md`'s existing promise that the gap score "stays internal ... it is never shown as a number badge." The `fit_note` and resume content are unaffected in *shape*, only in *wording*.

## Files touched

| Path | Change |
|-|-|
| `server/ai/keywordMatch.ts` | Rename `ARCHETYPES` → `ROLE_TYPES` (add `project-management`, merge streaming+batch into `etl-de`); add `INDUSTRIES` signal map; add `classifyIndustry(jdText, method)` (sync keyword path + async LLM path behind the env var); extend `JdAnalysis` shape; extend `formatReport()` with the two new lines |
| `app/api/resume/questions/route.ts` | Call `classifyIndustry`, merge into the shared report, `console.log` the resolved classification |
| `app/api/resume/generate/route.ts` | Same call + logging; extend `LAYOUT DECISION` prompt clause; relax the skills-group-order prompt rule |
| `docs/resume-chat.md` | Update step 2 ("what kind of role") and step 4 (layout decision) descriptions to mention industry + role-type |

No new files, no new dependencies, no new env infra beyond the one toggle var (plain `process.env`, matching this repo's existing convention in `server/ai/llm.ts`).

## Testing / verification

No test framework exists in this repo (`package.json` has no test script). Verification is manual, matching the "env-var toggle, manual compare" approach already chosen for the A/B question:

1. Run the dev server, paste 3 sample JDs through the real chat flow — one Kafka/streaming-flavored, one Tableau/BI-flavored, one PM-flavored (stakeholder/roadmap language).
2. Confirm the logged `{roleType, industry, method}` matches expectations for each.
3. Toggle `RESUME_INDUSTRY_CLASSIFIER=llm`, repeat, compare industry labels against the keyword-path run for the same 3 JDs.
4. Eyeball that generated bullets/layout/skills order shift sensibly between an `etl-de` JD and a `bi-analytics` JD (e.g. skills group ordering flips).

## Out of scope

- No live randomized A/B split or outcome tracking (no infra for it, not worth building for this traffic volume).
- No UI surfacing of the classification.
- No change to `checkResume()` quality gate — it checks phrasing mechanics, not content strategy.
