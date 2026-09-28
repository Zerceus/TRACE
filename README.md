# TRACE — AI Debugging Microscope

> **Reconstruct the failure. Fix the cause.**

TRACE helps developers understand software failures by reconstructing *what happened* — not just explaining the error message. Instead of reading a stack trace, you see the exact sequence of events that led to the crash, the root cause, the minimal fix, and the tests to prevent it recurring.

**[Live Demo →](#) · [GitHub →](https://github.com/Zerceus/TRACE)**

---

## What it does

Paste any debugging evidence — a runtime error, stack trace, SQL error, API diff, or code snippet — and TRACE produces a structured forensic analysis in under two seconds:

| Section | What you get |
|---|---|
| **Failure** | Severity triage, error category, symptom |
| **Root Cause** | The underlying reason (not just the message), with confidence rating and numbered evidence |
| **Execution Reconstruction** | Interactive step-by-step trace of what happened at runtime — clickable nodes with causal explanations |
| **Minimal Fix** | Before/after code diff. The smallest safe change, not a rewrite |
| **Regression Risk** | Risk level, why it could recur, and recommended test scenarios |
| **Prevention** | 2–4 specific, evidence-grounded recommendations |

The **Execution Reconstruction** is TRACE's signature feature. It renders a clickable vertical flow where every node can be expanded to reveal *why that step matters* to the failure. This is the difference between knowing *where* something broke and understanding *why it had to break*.

---

## Demo

**Primary workflow:**

1. Click **"TypeScript Runtime Error"** in the Examples section
2. Click **"Analyze with TRACE"**
3. Watch the execution flow reconstruct the failure step by step
4. Click the red `FAIL` node to see the causal explanation
5. Read the before/after minimal fix
6. Click **"Generate Tests"** to get a Vitest regression test scaffold

The entire flow — from pasted error to fix to tests — takes under 60 seconds.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v4 |
| Build tool | Vite 8 |
| AI | OpenAI GPT-4o (drop-in) / deterministic mock (offline) |
| State | React `useState` — no external state library |
| Fonts | JetBrains Mono + Inter (Google Fonts) |

---

## Getting started

```bash
git clone https://github.com/Zerceus/TRACE.git
cd TRACE
npm install
npm run dev
# → http://localhost:5173
```

**Optional — enable live AI analysis:**

Create a `.env` file in the project root:

```
VITE_OPENAI_API_KEY=sk-your-key-here
```

Without a key, TRACE runs in **Mock Mode** — all three demo examples (TypeScript Error, SQL Error, API Breaking Change) produce full deterministic analyses. The demo is fully functional offline.

---

## Architecture

```
src/
  components/         # 10 focused UI components
    Header.tsx        # Brand, status indicator, tagline
    InputPanel.tsx    # Evidence input, type selector, examples
    AnalysisPanel.tsx # Full 6-section result layout
    ExecutionFlow.tsx # Signature feature: clickable causal trace
    MinimalFix.tsx    # Before/after code + copy-to-clipboard
    RegressionRisk.tsx # Risk badge + Generate Tests
    ...
  services/
    aiService.ts      # Provider abstraction: Mock + OpenAI
    mockData.ts       # 3 complete deterministic demo responses
    validator.ts      # JSON contract validation before render
  types/
    analysis.ts       # Full TypeScript contract for AI response
  utils/
    generateTests.ts  # Vitest scaffold generator (client-side)
  data/
    examples.ts       # 3 built-in example inputs
```

**AI abstraction pattern:**

```typescript
interface AIProvider {
  analyze(input: string, type: AnalysisType): Promise<AnalysisResult>
}
// MockAIProvider activates when no API key is present
// OpenAIProvider activates when VITE_OPENAI_API_KEY is set
```

Every AI response is validated against a strict TypeScript schema before rendering. Malformed responses are caught and surfaced as recoverable errors — TRACE never renders `undefined` or `null` as visible text.

---

## AI Response Contract

TRACE enforces a strict JSON contract for all AI responses:

```typescript
interface AnalysisResult {
  title: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  rootCause: string
  symptom: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string[]
  executionFlow: ExecutionStep[]   // { label, description, status }
  fix: { before: string; after: string; explanation: string }
  regressionRisk: { level: RiskLevel; reason: string; tests: string[] }
  prevention: string[]
}
```

The AI system prompt explicitly instructs the model to:
- Separate observable symptom from root cause
- Never invent facts not present in the supplied evidence
- Prefer minimal, localized fixes over rewrites
- State explicitly when evidence is insufficient

---

## How IBM Bob was used in this project

TRACE was designed and built entirely within **IBM Bob** — IBM's AI software engineering assistant. Bob's role went far beyond code generation:

### 1. Architecture and planning

Bob analyzed the product requirements and designed the full system architecture before a single line was written — identifying the right boundaries between components, the AI provider abstraction pattern, the JSON contract design, and the mock/live provider strategy. A structured 9-subtask implementation plan was written to [`trace-plan.md`](./trace-plan.md) before any code was generated.

### 2. Full-stack implementation

Every file in the project was written by Bob end-to-end across 9 sequential implementation subtasks:

- **Type system** (`src/types/analysis.ts`) — the full TypeScript contract for the AI response
- **AI service layer** (`src/services/aiService.ts`) — the provider abstraction, mock pattern-matching, OpenAI integration, and response validation
- **Mock data** (`src/services/mockData.ts`) — three complete, realistic deterministic analysis responses for offline demo use
- **All 10 React components** — from the Header to the signature ExecutionFlow with clickable causal nodes
- **Validator** (`src/services/validator.ts`) — runtime JSON schema validation to prevent malformed AI responses from reaching the UI
- **Test generator** (`src/utils/generateTests.ts`) — client-side Vitest scaffold generation from regression risk data
- **CSS architecture** — Tailwind CSS v4 theme configuration with custom color tokens, JetBrains Mono integration, and `prefers-reduced-motion` support

### 3. Build tooling decisions

Bob identified that the project scaffolded with Tailwind CSS v4 (not v3), diagnosed the structural difference in the package layout, and adapted the setup to use the `@tailwindcss/vite` plugin rather than the traditional PostCSS approach — without any manual intervention.

### 4. Quality enforcement

After each implementation subtask, Bob ran `npm run build` to verify TypeScript compiled cleanly and Tailwind produced no warnings — catching and fixing issues (CSS `@import` ordering, unused variables, `dist/` in `.gitignore`) before they reached the repository.

### 5. Git workflow

Bob initialized the repository, handled the rebase conflict when merging with the pre-existing GitHub remote, cleaned up the `.gitignore` to exclude `dist/` and `node_modules/`, and pushed all commits.

### 6. Documentation

Bob wrote this README, the [`trace-plan.md`](./trace-plan.md) architecture plan, and the hackathon demo guide — all grounded in the actual codebase rather than generated from templates.

---

## Judging Criteria

### Effective and meaningful integration to address the problem statements

TRACE directly addresses a problem every software developer faces daily: **the gap between what an error message says and what actually caused it**. Traditional debugging tools (stack traces, console logs, search engines) surface *where* something broke — not *why*. TRACE closes that gap by reconstructing causality.

The AI integration is meaningful, not decorative:

- The **system prompt** is engineered with a forensic framing — TRACE is instructed to separate symptom, root cause, evidence, execution sequence, fix, and prevention as distinct analytical layers. This is not "explain this error" — it's a structured reasoning protocol.
- The **execution flow** is generated by the AI as a causal narrative, not inferred from a generic template. Each step includes a `status` (`normal` / `warning` / `failure`) and a `description` that explains its significance to the failure.
- The **minimal fix** instruction explicitly tells the AI to prefer the smallest safe change and preserve the developer's architecture — a deliberate design choice against the tendency of AI tools to over-engineer solutions.
- The **JSON contract validation** ensures AI output is always trustworthy before rendering. TRACE never displays hallucinated or malformed content.
- The **mock provider** uses real AI-quality deterministic responses (not placeholders), meaning the product is immediately demonstrable without any API dependency.

### Real-world use case relevance, sustainability and potential adoption

**Relevance:**
The TypeScript bug demonstrated in the primary demo (`let options = undefined` followed by property assignment) is a class of error that appears in production codebases every day. TRACE handles the four most common categories of debugging evidence developers encounter: runtime errors, SQL failures, API breaking changes, and Git diffs — chosen deliberately because they cover the majority of debugging sessions across frontend, backend, and infrastructure work.

**Sustainability:**
- **Zero infrastructure required** — TRACE is a pure frontend application. No database, no backend, no auth. Hosting cost is effectively zero (static file hosting on Vercel, Netlify, or GitHub Pages).
- **AI cost scales with usage** — the OpenAI API is called only when a user analyzes evidence. There is no background processing or polling.
- **Offline-capable demo mode** — the mock provider means the product remains fully functional for the three primary use cases without any API calls. This makes it resilient to network issues and API outages.
- **Clean abstraction** — swapping OpenAI for a different model (Anthropic, watsonx, local Ollama) requires changing one class in `aiService.ts`. The rest of the application is model-agnostic.

**Potential adoption:**
- Individual developers can use it immediately — paste an error, get a structured analysis in under two seconds.
- The **Generate Tests** feature directly produces code that goes into a project, reducing the friction from "I understand the bug" to "I've prevented the bug."
- Natural growth path: VS Code extension (analyze errors without leaving the editor), GitHub Actions integration (analyze failing test output in CI), team workspaces (shared analysis history for post-mortems).
- The product solves a universal problem — debugging is language-agnostic, framework-agnostic, and seniority-agnostic. Junior developers get structured explanations. Senior developers get fast triage and regression scaffolds.

---

## Scope decisions

TRACE is an intentional MVP. Deliberately excluded:

- Authentication / user accounts
- Database persistence
- GitHub / Jira integration
- Multi-page routing
- Settings / preferences

The focus is one exceptionally polished debugging workflow. Every feature that exists works completely.

---

## License

MIT
