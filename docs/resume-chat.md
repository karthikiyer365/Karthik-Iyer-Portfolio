# Tailored Resume Chat

## What this feature is

The portfolio site's chat can build a custom, job-specific resume on the spot. A recruiter or hiring manager pastes a job description into the chat, answers a few short questions about the role, and receives a polished, ready-to-print resume tailored to that exact job — plus an honest note about how well Karthik fits it.

Every resume is built only from Karthik's real, verified accomplishments. The system never invents skills, numbers, or experience. What it does is *choose and word* the strongest real material for the job at hand — the same way a careful human would rewrite a resume for each application, but in seconds.

## Who it's for and when to use it

- **Recruiters / hiring managers** — paste the job posting you're hiring for and get a resume shaped around your role's actual requirements, along with a frank assessment of fit (including where the fit is only partial).
- **Karthik** — every generated resume also produces a LaTeX file behind the scenes, in the exact format used by the offline resume pipeline, so any version made in chat can be reproduced and fine-tuned there.

## How it works, step by step

1. **Paste detection** — the chat notices when a message looks like a job description instead of a normal question, and switches into resume mode automatically.
2. **Gap check (instant, automatic)** — the system compares the job's keywords against Karthik's background and scores the overlap: what matches, what's missing, and what kind of role this is (streaming data, analytics, ML, cloud infra, …). This score stays internal — it guides the next steps, it is never shown as a number badge.
3. **A few smart questions** — the chat asks 3–5 pointed questions about the role, aimed at the real gaps. Example: *"The role lists Kafka — would Karthik's Twilio event-routing experience count for that requirement?"* The recruiter can answer or simply skip.
4. **Layout decision** — before writing anything, the system decides which resume shape shows the strongest evidence for this particular job:
   - **A** — 2 jobs + 4 projects (for hands-on, project-heavy roles)
   - **B** — 2 jobs + 3 projects with deeper detail (when a few items carry the most weight)
   - **C** — 3 jobs + 2 projects (balanced)
   - **D** — 4 jobs + 1 project (when professional tenure matters most)
5. **Writing** — each bullet point is written from a bank of verified accomplishments, following strict phrasing rules (lead with results, use exact numbers, name the actual tools, no clichés, no filler).
6. **Quality control** — the finished draft is automatically checked: at least 5 concrete numbers, zero buzzwords, teamwork signals present, no "I/my/me". If it fails, the system fixes it once automatically before showing it.
7. **Delivery** — the resume appears in the site's editor pane in a clean print format, an honest fit note appears in the chat, and a print-ready PDF is one click away.

## The flow at a glance

```
[Recruiter types in the chat]
   │
   ▼
Is it a job description?
   │
   ├─ No ──────────────────────────► normal chat about Karthik's
   │                                 skills, projects, experience
   │
   └─ Yes
        │
        ▼
   STEP 1 — GAP CHECK (instant, internal)
        compare job keywords vs Karthik's background
        → match score · missing skills · role type
        │
        ▼
   STEP 2 — SMART QUESTIONS
        chat asks 3-5 short questions aimed at the
        real gaps ("would X count for requirement Y?")
        recruiter answers — or skips
        │
        ▼
   STEP 3 — BUILD THE RESUME
        ├── pick the best layout for THIS job:
        │      A: 2 jobs + 4 projects   (project-heavy role)
        │      B: 2 jobs + 3 projects   (depth over count)
        │      C: 3 jobs + 2 projects   (balanced)
        │      D: 4 jobs + 1 project    (tenure matters most)
        │
        └── write every bullet from verified facts only,
            using strict phrasing rules (results first,
            real numbers, real tool names, no clichés)
        │
        ▼
   STEP 4 — QUALITY CONTROL (automatic)
        5+ real numbers · zero buzzwords ·
        teamwork signals · no "I / my / me"
        fails? → one automatic fix pass
        │
        ▼
   STEP 5 — DELIVERY
        ├── polished resume in the editor pane
        │      (classic professional format, prints
        │       on one or two letter pages)
        ├── honest fit note in the chat — why it's a
        │      good fit, or a frank "roughly N% match,
        │      the role leans toward X" when it isn't
        └── one-click print to PDF
             (+ a LaTeX copy saved behind the scenes
                for the offline resume pipeline)
```

## What makes it trustworthy

- **No invented facts.** Bullets come only from a curated bank of real accomplishments; the writing step can rephrase and re-emphasize, never fabricate.
- **Honesty over salesmanship.** When the fit is weak, the chat says so plainly instead of overselling.
- **Consistent quality.** The same automatic checks run on every resume, so nothing leaves the pipeline with clichés, missing numbers, or first-person slips.
- **One source of truth.** The chat version and the offline LaTeX version are built from the same material and the same rules, so they never drift apart.
