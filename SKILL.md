---
name: paper-course
description: "Turn any academic paper into a beautiful, interactive HTML tutorial. Use this skill whenever someone wants to create a tutorial, course, or educational walkthrough from a research paper. Trigger when users mention: 'turn this paper into a course,' 'explain this paper interactively,' 'make a tutorial from this paper,' 'teach me this paper,' 'interactive walkthrough of this research,' 'convert this PDF to a tutorial.'"
---

# Paper-to-Course

Turn any academic paper into a beautiful interactive tutorial. The output is a **directory** containing the pre-built `styles.css`, `main.js`, the HTML file for each module, and the assembled `index.html` -- just open it in a browser; the only external dependencies are the Google Fonts CDN and the KaTeX CDN.

## First-Run Welcome

When the skill is first triggered and the user hasn't specified a paper yet:

> **I can turn any academic paper into an interactive tutorial that helps you fully understand the paper and the body of knowledge behind it.**
>
> Just tell me where the paper is:
> - **A local PDF file** -- e.g. "turn ./paper.pdf into a tutorial"
> - **An online paper link** -- e.g. "make a tutorial from https://arxiv.org/abs/xxxx.xxxxx"
> - **A PDF in the current directory** -- if there is a paper in the directory, just say "turn this paper into a tutorial"
>
> I will read the paper in depth, map out its line of knowledge, and then generate a beautiful HTML tutorial with equation derivations, experiment comparisons, a research lineage map, and interactive quizzes. The whole tutorial runs in the browser with no setup required.

If the user provides an arXiv URL, construct the PDF URL: `https://arxiv.org/pdf/xxxx.xxxxx`. Use WebFetch or Read to get the content. If they provide a DOI, resolve it via WebFetch.

## Language Strategy

**Automatically detect the user's input language** (the paper's language and the language of the user's message), and write the course content in that language.

**If the language cannot be detected, default to Simplified Chinese.**

Glossary tooltip format: `Explanation in the course language (English Term)` -- provide both an explanation in the course language and the original English term.

All UI text in the course (buttons, progress indicators, etc.) follows the language of the course content.

## Who This Is For

The target learner is the "curious practitioner" -- someone who runs into academic papers at work (AI/ML papers for engineers, medical papers for clinicians, finance papers for analysts) and wants to understand them deeply without spending hours wrestling with obscure terminology. They have some intuition for the field but lack systematic training in the paper's sub-field.

**Their goals:**
- Understand the paper's **actual contribution** (not just the abstract)
- Judge whether the results are meaningful
- Connect the paper to work they already know
- Be able to discuss the paper with domain experts
- Build a complete body of knowledge and understand the whole disciplinary context the paper sits in

## Why This Approach Works

Traditional paper reading: read line by line from start to finish → get stuck on the math → give up or remember only the abstract.

This approach: **build intuition first → understand the problem background → master the prerequisites → then look at the method and equations → verify understanding with experiments → think critically**.

Each module first answers "why should I care about this?", then "how does this work?". Concepts are explained in everyday language first, and mathematical formalism comes after.

---

## The Process

### Phase 1: Paper Acquisition & Deep Reading

Before writing any course HTML, deeply understand the paper. Read it systematically — title, abstract, introduction, related work, method, experiments, results, discussion, conclusion, references.

**What to extract:**
- Research question and hypothesis
- Key contributions (numbered list)
- Mathematical formulations (equation by equation, with LaTeX)
- Algorithm pseudocode
- Datasets used and why they were chosen
- Baselines compared against
- Evaluation metrics
- Key results (exact numbers)
- Limitations acknowledged by the authors
- Future work suggested
- The paper's "narrative arc" — what story is it telling?

**Read the paper multiple times:**
1. First pass: skim to understand the big picture
2. Second pass: extract structured data (equations, results, datasets)
3. Third pass: identify the narrative and pedagogical opportunities

### Phase 2: Knowledge Expansion

This phase is unique to paper-to-course. A paper is not self-contained — it exists within a research lineage.

**Identify prerequisite concepts:**
- What mathematical foundations does the paper assume? (e.g., probability theory, optimization, information theory)
- What domain concepts does the paper build on? (e.g., attention mechanism, policy gradient, transformer architecture)
- What would a curious practitioner NOT know that they need to know?

**Identify related work:**
- What are the most important predecessor papers?
- What alternative approaches exist?
- How does this paper differ from prior work?

**Use WebSearch** to find:
- Highly-cited related papers
- Tutorial or blog explanations of foundational concepts
- The historical evolution of the research area

**Research prerequisite concepts using WebSearch:**
- Search for each prerequisite concept to find the clearest explanations
- Verify which concepts a "curious practitioner" would likely NOT know
- Find 1-2 good blog posts or tutorials for each prerequisite concept
- Structure findings into the Module 0 brief (for complex papers) or Module 0 content (for simple papers)

**Structure the expansion into:**
- **Prerequisite concepts** — things you need to know before reading the paper
- **Related work** — what else has been tried, how this paper differs
- **Research context** — where this paper fits in the field's evolution

### Phase 3: Curriculum Design

Structure the course as **5-8 modules**. Papers are dense; they typically need more modules than codebases.

The arc always builds from background to context to specifics:

| Module Position | Purpose | Why it matters |
|---|---|---|
| 0 (mandatory) | "Background & Prerequisites: what you need to know first" | Teach the foundational concepts, math, and domain vocabulary the paper assumes. Use WebSearch to research what a curious practitioner would not know. |
| 1 | "Here is the problem and why you should care" | Ground the paper in a real-world scenario the learner has experienced |
| 2 | "The landscape: what has been tried before" | Situate the paper in its field; build vocabulary for the approach |
| 3 | "The key insight: what this paper proposes" | The method/approach, step by step with math derivations |
| 4 | "How they tested it: experimental design" | Datasets, baselines, metrics — why these choices? |
| 5 | "What they found: results and analysis" | Result tables/charts, comparison with baselines, what the numbers mean |
| 6 | "The bigger picture: implications and limitations" | What this means for the field, what the authors could not do |
| 7 | "Going further: related work and open questions" | Research lineage, connections to other areas |

This is a **menu, not a checklist**. A simple empirical paper might need 5 modules (0-4). A theory-heavy paper with multiple contributions might need 8 (0-7).

**Module 0 is mandatory.** It should contain:
- 3-5 prerequisite concepts, each explained with intuition + visual + optional formalism
- A "knowledge map" SVG showing how concepts connect
- At least one quiz to verify understanding
- Clear markers distinguishing "background" content from "paper content"
- Use WebSearch to verify prerequisite concepts and find good explanations

**Each module should contain:**
- 3-6 screens (sub-sections within the module)
- At least one interactive element (quiz, visualization, animation)
- One or two "aha!" callout boxes with key insights
- SVG diagrams for visual explanation where appropriate

**Mandatory interactive elements per course:**
- **Math Derivation Walkthrough** — at least one step-by-step equation derivation
- **Research Lineage Tree** — at least one visual showing how this paper relates to prior work
- **Pseudocode Walkthrough** — at least one pseudocode block with line-by-line explanation
- **Result Comparison Interactive** — at least one interactive result comparison
- **Quizzes** — at least one per module
- **Glossary Tooltips** — on every technical/mathematical term, first use per module

**Do NOT present the curriculum for approval — just build it.** The user wants a tutorial, not a planning document.

**After designing the curriculum, decide which build path:**
- **Simple paper** (5-6 modules, single clear contribution) → Phase 4 Sequential
- **Complex paper** (7+ modules, multiple contributions, heavy math) → Phase 3.5 first, then Phase 4 Parallel

### Phase 3.5: Module Briefs (complex papers only)

For complex papers, write a brief for each module before writing any HTML. Read `references/module-brief-template.md` for the template.

**For each module, write a brief to `course-name/briefs/0N-slug.md` containing:**
- Teaching arc (intuition, opening hook, key insight)
- Pre-extracted equations (copy-pasted with LaTeX)
- Pre-extracted key figures/tables descriptions
- Interactive elements checklist with enough detail to build them
- Knowledge expansion notes (what background concepts this module assumes)
- Which sections of which reference files the writing agent needs
- What the previous and next modules cover

### Phase 4: Build the Course

The course output is a **directory**, not a single file. All CSS and JS are pre-built reference files — never regenerate them.

**Output structure:**
```
course-name/
  styles.css       ← copied verbatim from references/styles.css
  main.js          ← copied verbatim from references/main.js
  _base.html       ← customized shell (title, accent color, nav dots, sidebar items, KaTeX)
  _cover.html      ← custom cover/hero page with paper metadata
  _footer.html     ← copied verbatim from references/_footer.html
  build.sh         ← copied verbatim from references/build.sh
  briefs/          ← module briefs (complex papers only)
  modules/
    00-background.html
    01-problem.html
    02-landscape.html
    ...
  index.html       ← assembled by build.sh
```

**Step 1 (both paths): Setup** — Create the course directory. Copy these four files verbatim using Read + Write:
- `references/styles.css` → `course-name/styles.css`
- `references/main.js` → `course-name/main.js`
- `references/_footer.html` → `course-name/_footer.html`
- `references/build.sh` → `course-name/build.sh`

**Step 2 (both paths): Customize `_base.html`** — Read `references/_base.html`, then write it to `course-name/_base.html` with substitutions:
- `COURSE_TITLE` → the actual course title (in the detected language)
- `ACCENT_*` → chosen accent color values (pick one palette from comments)
- `NAV_DOTS` → one `<button class="nav-dot" ...>` per module
- `SIDEBAR_ITEMS` → one `<a class="sidebar-item" ...>` per module, with matching `data-module` and `href="#module-N"` attributes

**Step 2.5: Build `_cover.html`** — Write a cover page file `course-name/_cover.html` containing the course hero section. Read the pattern from `references/interactive-elements.md` (Cover Page section). The cover must include:
- Paper title (in the detected language, with English original in parentheses if translated)
- Author list
- One-sentence topic overview (as subtitle)
- Abstract (abbreviated to 2-3 sentences)
- Metadata badges: difficulty level, estimated reading time, number of modules
- A "Start Learning" button that scrolls to Module 0

**Step 3: Write modules** — Two paths:

#### Sequential path (simple papers)
Read `references/content-philosophy.md` and `references/gotchas.md`. Then write modules one at a time. For each module, write `course-name/modules/0N-slug.html` containing only the `<section class="module" id="module-N">` block.

Read `references/interactive-elements.md` for HTML patterns. Read `references/design-system.md` for visual conventions.

#### Parallel path (complex papers)
Dispatch modules to subagents in batches of up to 3. Each agent receives:
- Its module brief
- `references/content-philosophy.md` and `references/gotchas.md`
- Only the sections of `references/interactive-elements.md` and `references/design-system.md` listed in the brief

**Step 4 (both paths): Assemble** — Run `build.sh`:
```bash
cd course-name && bash build.sh
```

**Critical rules:**
- **Never regenerate** `styles.css` or `main.js` — always copy from references
- Module files contain only `<section>` content — no boilerplate
- Use `scroll-snap-type: y proximity` (NOT `mandatory`)
- Use `min-height: 100dvh` with `100vh` fallback
- Interactive element JS is in `main.js`; wire via `data-*` attributes and CSS classes
- Chat containers need `id` attributes
- Flow animations need `data-steps='[...]'` JSON
- Use inline SVG for diagrams, following design system conventions
- KaTeX renders `$$...$$` automatically via `_base.html` script

### Phase 5: Review and Open

After running `build.sh`, open `index.html` in the browser. Walk the user through what was built and ask for feedback.

**Review checklist:**
- [ ] Cover page displays paper title, authors, abstract, metadata badges, and "Start Learning" button
- [ ] Module 0 (Background & Prerequisites) exists and teaches prerequisite concepts before the paper's content
- [ ] Sidebar navigation shows all module names, highlights current module on scroll
- [ ] Sidebar collapses to toggle button on mobile (≤1024px)
- [ ] All math renders correctly (no raw LaTeX visible)
- [ ] All interactive elements work (quizzes, derivations, comparisons)
- [ ] Glossary tooltips appear on hover/click
- [ ] No walls of text — every screen is 50%+ visual
- [ ] Every equation has intuition → formalism → interpretation
- [ ] Results have context (compared to what? is this good?)
- [ ] Limitations are surfaced, not hidden
- [ ] SVG diagrams are responsive
- [ ] Language is consistent throughout
- [ ] Module transitions are coherent

---

## Design Identity

The visual design should feel like a **beautiful research notebook** — warm, inviting, academic but not cold. Read `references/design-system.md` for the full token system.

**Non-negotiable principles:**
- **Warm palette**: Off-white backgrounds, warm grays, NO cold whites
- **Bold accent**: One confident accent color (vermillion, teal, amber — NOT purple gradients)
- **Distinctive typography**: Bricolage Grotesque for headings, DM Sans for body, JetBrains Mono for code/math
- **Generous whitespace**: Modules breathe. Max 3-4 short paragraphs per screen.
- **Alternating backgrounds**: Even/odd modules alternate between two warm tones
- **Dark code blocks**: IDE-style with Catppuccin syntax highlighting on #1E1E2E
- **SVG diagrams**: Use design system colors, responsive with viewBox

---

## Reference Files

The `references/` directory contains detailed specs. **Read them only when you reach the relevant phase.**

- **`references/content-philosophy.md`** — Teaching principles, quiz design, tooltip rules. Read during Phase 3.5 and Phase 4.
- **`references/gotchas.md`** — Common failure points checklist. Read during Phase 4 and Phase 5.
- **`references/module-brief-template.md`** — Template for Phase 3.5 module briefs. Read only for complex papers.
- **`references/design-system.md`** — CSS tokens, color palette, typography, SVG conventions. Read during Phase 4.
- **`references/interactive-elements.md`** — HTML patterns for every interactive element. Read during Phase 4.
