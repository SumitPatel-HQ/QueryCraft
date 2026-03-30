# QueryCraft multi-agent system specification

## Purpose

This file defines how agents should operate in QueryCraft so work is senior-grade, contract-safe, and efficient.

QueryCraft is a contract-first NL-to-SQL application.

- Backend: FastAPI, database/session management, schema introspection, NL-to-SQL processing, upload handling, query execution, caching, and query history.
- Frontend: Next.js 16, React 19, Clerk auth, landing page, dashboard, chat, schema, ERD, and database detail flows.
- Default project priority: protect backend and query correctness first, then improve frontend polish.

User instructions override this file. This file overrides generic agent defaults.

## Decision principle

Optimize for correct, efficient execution, not maximum process.

- Do not expand scope unnecessarily.
- Do not invoke steps or skills without clear benefit.
- Prefer the simplest path that preserves correctness and contract safety.
- When multiple valid approaches exist, prefer the one with the lowest coordination overhead.
- Do not decompose work beyond what is necessary to execute it safely.
- Process is a tool, not a ritual.

## High-level architecture

The system is organized into four planes so concerns stay separated and role boundaries remain clear.

### Control Plane

Owns intake, routing, scope control, and task classification.

- Accept user requests.
- Triage repo relevance.
- Route work to the right capability and delivery path.
- Prevent unnecessary workflow overhead.

The Control Plane does not implement code.

### Capability Plane

Owns reusable skills and specialized methods of working.

- Select relevant skills from `.skills`.
- Apply skill contracts only when trigger conditions are met.
- Avoid ceremonial or blanket skill usage.

The Capability Plane does not mutate code by itself.

### Delivery Plane

Owns planning, implementation, verification, and review.

- Plan work.
- Execute approved changes.
- Verify correctness with commands and checks.
- Review regressions, quality, and contract safety.

Only the Implementer role in this plane may mutate repo-tracked files.

### State Plane

Owns continuity, assumptions, and execution history.

- Maintain session memory and handoff state.
- Preserve task context across planning, execution, verification, and review.
- Keep the system consistent when multiple roles or phases are involved.

The State Plane tracks work. It does not invent work.

## Agent roles

These roles describe responsibilities, not theater. Activate only the roles the task actually needs.

- `A1 Engineer Gateway`: entry point for user requests, framing, and response handoff.
- `A2 Intent Router`: classifies request type, scope, and risk.
- `A3 Context Scanner`: performs bounded repo triage and targeted context gathering.
- `A4 Skill Orchestrator`: selects and applies relevant local skills from `.skills`.
- `A5 Contract Guard`: protects backend, query, and cross-layer interfaces.
- `A6 Planner`: converts accepted work into a concrete task graph or implementation plan.
- `A7 Implementer`: the only role allowed to mutate repo-tracked files.
- `A8 Verifier`: runs objective checks and records evidence.
- `A9 Reviewer`: checks regressions, design quality, standards, and implementation quality.
- `A10 State Keeper`: maintains assumptions, continuity, and event-log style state.

## Role activation rule

Not all agents need to be active for every task.

- Activate only the roles required for the current task.
- Do not simulate unused roles.
- Prefer minimal sufficient orchestration.
- Do not turn small tasks into a full role parade.

## Complexity-based execution rule

Execution depth must match task complexity.

### Trivial tasks

Use the minimum viable path.

Typical active roles:

- `A1 Engineer Gateway`
- `A2 Intent Router`
- `A3 Context Scanner`
- `A7 Implementer`
- `A8 Verifier` only if a meaningful check exists

Examples:

- typo fixes
- isolated doc edits
- small local changes with no contract, architecture, or cross-layer risk

### Medium tasks

Add planning and contract protection when risk increases.

Typical active roles:

- `A1` through `A7`
- `A5 Contract Guard` when interfaces are involved
- `A6 Planner` when the work is multi-step
- `A8 Verifier`
- `A9 Reviewer` when regression or design risk is meaningful

Examples:

- cross-file refactors
- backend behavior adjustments
- frontend work touching data flow or contract assumptions

### Complex tasks

Use full orchestration only when it materially helps.

Typical active roles:

- all relevant roles across Control, Capability, Delivery, and State planes

Examples:

- multi-step features
- cross-layer contract changes
- decomposable workstreams
- work requiring planning, verification, review, and continuity tracking

The system must never force the full role stack onto simple work.

## Startup triage scan

Start with a top-level triage pass, not a full repo read.

- Classify top-level folders by purpose and current relevance.
- Read deeper only in areas needed for the current task.
- Always check `.skills` and top-level project docs for routing and context, not for full ingestion.
- Do not summarize the entire repo unless the user asks for that.

Expected first-pass areas:

- `.claude`: local assistant settings if relevant.
- `.doc`: active plans or local working docs when relevant.
- `.skills`: the local capability registry for this repo.
- `backend`: backend contracts, execution flow, and reliability work.
- `frontend`: UI flows, client behavior, and polish work.
- top-level docs and configs such as `PROJECT_ROADMAP.md`, `SETUP_GUIDE.md`, `.gitignore`, and `docker-compose.yml`.
- `.guidelines`: visible but private. Do not inspect, cite, or rely on it unless the user explicitly opts in.

For small, local, low-risk tasks, keep this pass light.

## Capability and skills

Treat `.skills` as the canonical local capability registry. Select skills by trigger condition, not by ritual.

Do not enumerate every skill file by default. Do not mention skills ceremonially without using them.

### Skill contracts

Each skill is a capability contract:

- it has a trigger condition,
- it has a job,
- it has a boundary,
- it should be used only when it improves correctness, safety, clarity, or speed.

### Local skill families

- `superpowers`: process and execution discipline.
- `frontend-design`: distinctive frontend building and meaningful frontend polish.
- `humanizer`: rewriting docs or copy to sound more natural.
- `prd`: product requirements drafting and scoped feature definition.
- `ralph`: converting PRDs into Ralph format when requested.
- `vercel-composition-patterns`: React component API and composition refactors.
- `vercel-react-best-practices`: React and Next architecture and performance guidance.
- `vercel-react-native-skills`: present, but non-primary for this web-first repo. Use only if mobile or native work appears.
- `web-design-guidelines`: UI, UX, accessibility, and interface quality review.

### Superpowers routing

Use these local superpowers when their trigger condition is met:

- `using-superpowers`: when skill routing is unclear or when beginning a new task that may need process guidance.
- `brainstorming`: before substantial design or implementation work.
- `writing-plans`: before coding multi-step work.
- `systematic-debugging`: for bugs, regressions, failed tests, unclear backend/query issues, or unexpected behavior.
- `test-driven-development`: for bug fixes and behavior changes.
- `verification-before-completion`: before any completion claim.
- `requesting-code-review` and `receiving-code-review`: when review is the task or the next gate.
- `finishing-a-development-branch`: when implementation is done and branch completion is next.
- `using-git-worktrees`: when isolation is needed before implementation.
- `subagent-driven-development`: when task decomposition is real and subagent overhead is justified.
- `dispatching-parallel-agents`: only for truly independent workstreams.
- `executing-plans`: when subagents are unavailable or work should stay linear.

## Guideline protocol

`.guidelines` is opt-in only.

- Agents may know that `.guidelines` exists.
- Agents must not inspect, cite, summarize, or rely on it unless the user explicitly asks.
- Design references, animations, motion direction, or visual standards from `.guidelines` must never be pulled into the project implicitly.

This prevents unsolicited design references or style contamination.

## Deterministic execution flow

The default orchestration flow is:

`Intake → Route → Guard → Plan → Implement → Verify → Review → Release`

The flow is deterministic, but it can collapse for small tasks when intermediate stages add no value.

### 1. Intake

Owner: `A1 Engineer Gateway`

- Accept the user request.
- Frame the task.
- Establish whether the task is trivial, medium, or complex.

Exit condition: the request is understood well enough to route.

### 2. Route

Owners: `A2 Intent Router`, `A3 Context Scanner`, `A4 Skill Orchestrator`

- Triage the repo.
- Identify relevant folders, docs, and capabilities.
- Select only the needed skills and roles.

Exit condition: the work has a bounded path.

### 3. Guard

Owner: `A5 Contract Guard`

- Check for backend, query, schema, and cross-layer contract risk.
- Block unsafe assumptions before implementation begins.

Exit condition: contract safety is clear, or a contract change is explicitly raised.

### 4. Plan

Owner: `A6 Planner`

- Create the task graph or implementation plan when the work is multi-step.
- Keep the plan as light as possible while remaining decision-complete.

Exit condition: implementation can proceed without guessing.

### 5. Implement

Owner: `A7 Implementer`

- Make the code or document changes.
- Follow the selected skills and contract guardrails.

Only `A7 Implementer` may mutate repo-tracked files.

Exit condition: the requested change is implemented.

### 6. Verify

Owner: `A8 Verifier`

- Run evidence-based checks.
- Use commands that actually prove the claim.

For frontend work, verification should use the real repo commands when relevant:

- `pnpm lint`
- `pnpm build`

Run them from `frontend`.

Exit condition: there is objective evidence for correctness or an explicit record of what failed.

### 7. Review

Owner: `A9 Reviewer`

- Check for regressions, design quality, code quality, and standards alignment.
- For frontend work, explicitly review motion and interaction quality when GSAP or Framer Motion are involved.

Exit condition: the change meets the repo’s quality bar.

### 8. Release

Owners: `A1 Engineer Gateway`, `A10 State Keeper`

- Present the outcome honestly.
- Record key assumptions, caveats, or next actions.

Exit condition: the work is communicated clearly and consistently.

## Execution path selection

Choose the lightest path that still protects correctness.

`subagent-driven-development` is preferred only when the work is genuinely decomposable.

Use it when:

- the plan has independent or weakly coupled tasks,
- parallel or isolated execution will reduce risk,
- the harness supports subagents.

Do not use it when:

- the task is tiny,
- the work is tightly coupled,
- a single decision thread dominates the task,
- subagents would add more overhead than clarity.

`dispatching-parallel-agents` is only for genuinely independent domains.

`executing-plans` is the fallback when:

- subagents are unavailable,
- the work should stay linear,
- the task is structured but not worth fragmentation.

For trivial tasks, keep execution linear and lightweight.

## Architecture and contracts

Backend contracts are stable unless intentionally changed.

Stable contracts include:

- API routes and request/response behavior,
- query semantics and execution behavior,
- schema introspection behavior,
- error, fallback, and validation behavior that the frontend depends on.

Frontend must consume these contracts, not redefine them implicitly.

- Do not assume undocumented backend behavior.
- Do not patch over contract mismatches by inventing local frontend-only data shapes.
- Do not silently depend on unstable query behavior.
- If a backend contract needs to change, call it out explicitly during planning.

Cross-layer changes must be treated as contract changes, not smuggled in through UI work.

## Current priorities

### Priority 1: backend and query reliability

Optimize for:

- query correctness,
- stable contracts,
- schema freshness,
- safer execution,
- clearer failure modes,
- better debugging visibility.

### Priority 2: frontend polish

Optimize for:

- UX clarity,
- responsive behavior,
- loading and empty states,
- visual consistency,
- stronger information hierarchy.

If there is tension between the two, reliability and contract safety win.

Frontend work can move in parallel only when it does not risk backend or query behavior.

## Repo guardrails

- Do not over-read irrelevant repo areas.
- Do not treat `.skills` as a checklist to recite.
- Do not activate unused roles.
- Do not role-play instead of solving the task.
- Do not add ceremony to simple work unless it materially improves correctness, safety, or clarity.
- Do not change backend contracts implicitly through frontend work.
- Do not inspect `.guidelines` unless the user explicitly opts in.
