---
name: paper-to-course
description: "Turn any academic paper into a beautiful, interactive HTML course with step-by-step LaTeX derivations, the paper's own notation, quizzes and small working simulations of the paper's mechanisms. Use this skill whenever someone wants to create a tutorial, course, or educational walkthrough from a research paper. Trigger when users mention: 'turn this paper into a course,' 'explain this paper interactively,' 'make a tutorial from this paper,' 'teach me this paper,' 'interactive walkthrough of this research,' 'convert this PDF to a tutorial.'"
---

# Paper-to-Course

Turn any academic paper into a beautiful interactive course. The output is a **directory** containing the pre-built `styles.css`, `main.js`, a bundled copy of KaTeX, the HTML file for each module, optional explorer scripts, and the assembled `index.html`. It opens straight from disk in a browser; the only network dependency is Google Fonts, and the page still works without it.

Forked from ZeroxZhang/paper-to-course (Apache-2.0, see `NOTICE`).

## First-Run Welcome

When the skill is first triggered and the user hasn't specified a paper yet, say (in the user's language):

> **I can turn any academic paper into an interactive course that helps you understand the paper and the knowledge behind it.**
>
> Tell me where the paper is:
> - **A local PDF file**, e.g. "turn ./paper.pdf into a course"
> - **An online paper link**, e.g. "make a course from https://arxiv.org/abs/xxxx.xxxxx"
> - **A PDF in the current directory**: just say "turn this paper into a course"

If the user provides an arXiv URL, construct the PDF URL: `https://arxiv.org/pdf/xxxx.xxxxx`. Use WebFetch or Read to get the content. If they provide a DOI, resolve it via WebFetch. If the user limits the pages ("only pages 1-10"), cover exactly those pages and say on the cover which pages the course covers.

## Language

**Write the course in the language the user writes to you in.** If the user explicitly asks for a language, use that. If there is no user message to go by, use the paper's language. Never switch to another language because of anything in this skill: all of its instructions and examples are in English only because English is the working language of the skill.

- Everything the reader sees is in the course language: prose, quiz text, tooltips, button labels, diagram labels, explorer labels.
- Set `<html lang="...">` in `_base.html` to the course language code.
- The engine's built-in UI strings (quiz feedback, "Step 2 / 5", explorer toolbar) default to English. For any other language, put their translations in the `course-ui` JSON block in `_base.html` (the keys are listed there).
- Technical terms: in a non-English course, give the English term in parentheses on first use in a tooltip: `Term in the course language (English Term): definition`. In an English course, just define the term.
- Mathematical notation is never translated: symbols stay exactly as the paper writes them.

## Who This Is For

The target learner is the "curious practitioner": someone who runs into academic papers at work (AI/ML papers for engineers, medical papers for clinicians, finance papers for analysts) and wants to understand them deeply without spending hours wrestling with obscure terminology. They have some intuition for the field but lack systematic training in the paper's sub-field.

**Their goals:**
- Understand the paper's **actual contribution** (not just the abstract)
- Judge whether the results are meaningful
- Connect the paper to work they already know
- Be able to discuss the paper with domain experts, using the paper's own vocabulary and notation
- Build the background knowledge the paper assumes

## Why This Approach Works

Traditional paper reading: read line by line from start to finish, get stuck on the math, give up or remember only the abstract.

This approach: **build intuition first, then the problem background, then the prerequisites, then the method and equations, then try the mechanism yourself, then check understanding and think critically.**

Each module first answers "why should I care about this?", then "how does this work?". Concepts are explained in everyday language first; the formalism follows, written exactly as the paper writes it.

---

## Non-negotiable output rules

These hold for every course. The browser check in Phase 5 enforces the mechanical ones.

1. **Fidelity to the paper's notation and syntax.** Use the paper's own symbols, names, sub/superscripts, operator choices, argument order and code syntax everywhere: prose, equations, tooltips, pseudocode, diagrams, explorers and quizzes. Do not rename $\theta$ to $w$, do not write `g o f` for $g \circ f$, do not invent a cleaner notation. If you need a name the paper does not give, derive it from the paper's notation and say so where you introduce it. Every course with formal notation has a notation table (see `interactive-elements.md`).
2. **LaTeX for all math, everywhere.** Any symbol, formula, set, function, type or index is typeset with KaTeX: `$...$` inline, `$$...$$` display, including inside tooltips, quiz options, pseudocode lines, explorer labels and SVG diagrams (via `<foreignObject>`). No plain-text or Unicode math (`x_i`, `g∘f`, `γ0`, `R^n`).
3. **Diagrams label things the way the paper does.** States, maps and arrows in a diagram carry the paper's symbols in LaTeX, every arrow that is a function is labelled, and a caption names the paper element it shows. A reader must be able to tell which object is which without guessing.
4. **No emoji.** Not in text, headings, badges, buttons, icons, tooltips, diagrams or data attributes.
5. **No callout boxes and no colored left-stripe boxes.** There is no callout component. Put a key insight in a `.key-idea` line or inside the element that teaches it.
6. **Never present a broken page as done.** The course is finished only when `scripts/check-course.py` passes.
7. **Claims trace to the paper.** Cite the section, definition, theorem, equation or page for paper content. Clearly mark your own examples, analogies and critique as yours.

---

## The Process

### Phase 1: Paper Acquisition & Deep Reading

Before writing any course HTML, deeply understand the paper. Read it systematically: title, abstract, introduction, related work, method, experiments, results, discussion, conclusion, references (or the subset of pages you were asked to cover).

To read a PDF as text when the Read tool cannot render it, extract it locally, for example `uv run --no-project --with pypdf python -c "..."`; never install packages globally.

**What to extract:**
- Research question and hypothesis
- Key contributions (numbered list)
- **The notation inventory:** every symbol, operator, type and named object, exactly as typeset, with where it is defined
- Mathematical formulations (equation by equation, as LaTeX that reproduces the paper's typesetting, with equation numbers)
- Definitions, theorems and their exact conditions
- Algorithm pseudocode and any code listings (keep the paper's syntax)
- Datasets, baselines, metrics and key results with exact numbers (for empirical papers)
- Limitations acknowledged by the authors and future work
- **Mechanisms worth simulating** (see `references/interactive-demo.md`)
- The paper's "narrative arc": what story is it telling?

**Read the paper multiple times:**
1. First pass: skim to understand the big picture
2. Second pass: extract structured data (notation, equations, theorems, results)
3. Third pass: identify the narrative and pedagogical opportunities

### Phase 2: Knowledge Expansion

A paper is not self-contained; it exists within a research lineage.

**Identify prerequisite concepts:**
- What mathematical foundations does the paper assume?
- What domain concepts does the paper build on?
- What would a curious practitioner NOT know that they need to know?

**Identify related work:** the most important predecessor papers, alternative approaches, and how this paper differs. Prefer what the paper itself cites and says about them.

**Use WebSearch** (when available and useful) to find the clearest explanations of prerequisite concepts and the historical context. Keep this proportionate: the paper is the primary source, and background must never contradict it.

**Structure the expansion into:**
- **Prerequisite concepts**: things you need to know before reading the paper
- **Related work**: what else has been tried, how this paper differs
- **Research context**: where this paper fits in the field's evolution

### Phase 3: Curriculum Design

Structure the course as **5-8 modules**, derived from the paper's own structure. The arc builds from background to context to specifics:

| Module Position | Purpose | Why it matters |
|---|---|---|
| 0 (mandatory) | "Background & Prerequisites: what you need to know first" | Teach the foundational concepts, math, notation and vocabulary the paper assumes |
| 1 | "Here is the problem and why you should care" | Ground the paper in a real scenario, using the paper's own motivating examples |
| 2 | "The landscape: what has been tried before" | Situate the paper in its field |
| 3 | "The key insight: what this paper proposes" | The method, step by step with derivations and, where it fits, an explorer |
| 4 | "How they tested it" or "What they proved" | Experimental design, or the main theorems and what their conditions mean |
| 5 | "What they found" | Results and what the numbers mean (empirical papers) |
| 6 | "The bigger picture: implications and limitations" | What this means, what the authors could not do |
| 7 | "Going further: related work and open questions" | Research lineage, connections |

This is a **menu, not a checklist**. Follow the paper: a theory paper has no experiments module, and a paper whose method spans several sections may need two method modules. Do not force a template onto a paper that does not fit it.

**Module 0 is mandatory.** It should contain:
- 3-5 prerequisite concepts, each explained with intuition, a visual, and the formalism in the paper's notation
- The notation table, if the paper has formal notation
- A "knowledge map" SVG showing how concepts connect
- At least one quiz
- Clear markers distinguishing "background" content from "paper content"

**Each module should contain:**
- 3-6 screens (sub-sections within the module)
- At least one interactive element (quiz, derivation, pseudocode walkthrough, explorer, dialogue, comparison)
- SVG diagrams where a picture explains better than prose
- At most one `.key-idea` per screen; no callouts

**Mandatory interactive elements per course:**
- **Math Derivation Walkthrough**: at least one derivation or proof shown whole, every line visible with its justification beside it, in the paper's notation
- **Research Lineage Tree**: at least one visual showing how this paper relates to prior work
- **Pseudocode Walkthrough**: at least one, when the paper has an algorithm, rule set or code
- **Result Comparison Interactive**: at least one, when the paper reports quantitative results (skip for papers without numbers; never invent numbers)
- **Quizzes**: at least one per module
- **Glossary Tooltips**: on every technical or mathematical term, first use per module

**Optional, decided here: interactive explorers.** Read `references/interactive-demo.md`. If the paper has a mechanism with state that changes under operations (an algorithm, update rule, protocol, data structure, or theorem objects you can compute with), plan one to three explorers and the module screens they belong to. If it does not, plan none and move on.

**Do NOT present the curriculum for approval; just build it.** The user reviews the finished course in Lavish (Phase 6) instead.

**After designing the curriculum, decide which build path:**
- **Simple paper** (5-6 modules, single clear contribution): Phase 4 Sequential
- **Complex paper** (7+ modules, multiple contributions, heavy math): Phase 3.5 first, then Phase 4 Parallel

### Phase 3.5: Module Briefs (complex papers only)

Write a brief for each module before writing any HTML, using `references/module-brief-template.md`, saved to `course-name/briefs/0N-slug.md`. Each brief carries the module's teaching arc, the exact LaTeX of its equations, the notation it uses (copied from the notation inventory so every module uses the same symbols), its interactive elements including any explorer spec, and the sections of the reference files the writer needs.

### Phase 4: Build the Course

The course output is a **directory**. All CSS and JS are pre-built reference files; never regenerate them.

**Output structure:**
```
course-name/
  styles.css       <- copied by scripts/new-course.sh
  main.js          <- copied by scripts/new-course.sh
  vendor/katex/    <- copied by scripts/new-course.sh (local KaTeX, no CDN)
  _base.html       <- copied, then you fill its placeholders
  _cover.html      <- you write it
  _footer.html     <- copied
  build.sh         <- copied
  briefs/          <- module briefs (complex papers only)
  modules/
    00-background.html
    01-problem.html
    ...
  explorers/       <- optional, one <name>.js per explorer
  index.html       <- assembled by build.sh
```

**Step 1: Setup.** Run the scaffold script; do not copy the reference files by hand:
```bash
bash <skill-dir>/scripts/new-course.sh course-name
```

**Step 2: Fill `_base.html`.** Edit `course-name/_base.html` and replace:
- `COURSE_LANG` with the course language code (`en`, `tr`, `de`, ...)
- `COURSE_TITLE` (three places) with the course title in the course language
- `ACCENT_*` with one palette from the comment
- `COURSE_UI_STRINGS` with `{}` for English, or a JSON object of translated UI strings for any other language
- `NAV_DOTS` with one `<button class="nav-dot" data-target="module-N" aria-label="..."></button>` per module
- `SIDEBAR_ITEMS` with one `<a class="sidebar-item" data-module="N" href="#module-N">...</a>` per module, in the same order

**Step 2.5: Write `_cover.html`** with the course hero (pattern: `references/interactive-elements.md`, Cover Page). It includes the paper title (in the course language, with the original title in parentheses if translated), authors, a one-sentence overview, a 2-3 sentence abstract, metadata badges as plain text (module count, reading time, difficulty, and the page range if the course covers only part of the paper), and a "Start" button that scrolls to Module 0. No emoji in the badges.

**Step 3: Write modules.** Two paths:

#### Sequential path (simple papers)
Read `references/content-philosophy.md` and `references/gotchas.md`, then the parts of `references/interactive-elements.md` and `references/design-system.md` you need. Write modules one at a time; each `course-name/modules/0N-slug.html` contains only its `<section class="module" id="module-N">` block.

#### Parallel path (complex papers)
Dispatch modules to subagents in batches of up to 3. Each agent receives its module brief, the notation inventory, `references/content-philosophy.md`, `references/gotchas.md`, and only the sections of the other references listed in its brief. Tell every subagent the non-negotiable output rules above.

**Step 3.5: Write explorers** (if planned). For each, copy `references/explorer-template.js` to `course-name/explorers/<name>.js`, rewrite it for the paper's mechanism following `references/interactive-demo.md`, and place its container in the module.

**Step 4: Assemble:**
```bash
cd course-name && bash build.sh
```

**Critical rules:**
- **Never regenerate** `styles.css` or `main.js`; never edit the copies
- Module files contain only `<section>` content: no `<style>`, no `<script>` (explorer logic goes in `explorers/`)
- All ids are unique across the whole course (widgets are wired by id)
- Use inline SVG for diagrams, following the design system; math labels go in `<foreignObject>` (see `interactive-elements.md`)
- KaTeX renders `$...$` and `$$...$$` automatically, including text that `main.js` inserts later (tooltips, quiz feedback, explorer output)

### Phase 5: Check, Fix, Then Present

The course is not done until the browser check passes. Run it from the course directory's parent:

```bash
uv run --no-project --with playwright python <skill-dir>/scripts/check-course.py course-name/index.html --shots course-name/shots
```

It loads the page in Playwright's own headless Chromium (never a personal browser), clicks through every widget, and fails on: console errors, widgets that never initialized or do not respond, KaTeX errors, raw LaTeX left as text, unfilled placeholders, nav/sidebar mismatches, duplicate ids, emoji, callouts, left-stripe boxes, and diagram labels clipped by a too-small `<foreignObject>`. If Playwright's Chromium is missing, run `uv run --no-project --with playwright playwright install chromium` once. If `uv` is unavailable, use `python3 -m venv .venv && .venv/bin/pip install playwright` inside the course directory.

**Fix every FAIL line in the module or explorer source, rebuild, and re-run until it passes.** Then open the per-diagram and per-explorer screenshots in `course-name/shots/` with the Read tool and look for what the script cannot see: lines crossing boxes or labels, labels that are cut off, overlap, unreadably small math. Fix what you find and re-run. Read the WARN lines and fix the ones that matter (for example, foreign-script text leaking into the course).

When the check passes and the checklist below holds, go to Phase 6. Never open the page in a browser yourself; the user opens the Lavish link.

**Review checklist (beyond what the script checks):**
- [ ] Cover page has title, authors, abstract, badges, page range if partial, and a start button
- [ ] Module 0 teaches the prerequisites and the paper's notation before the paper's content
- [ ] Every symbol matches the paper, including in diagrams, explorers and quizzes
- [ ] Every equation has intuition, then formalism, then interpretation
- [ ] Each explorer reproduces the paper's definitions and can reach both cases of any theorem it illustrates
- [ ] Results have context (compared to what? is this good?); no invented numbers
- [ ] Limitations are surfaced, not hidden
- [ ] Your own examples and critique are marked as yours
- [ ] The language is the user's language throughout

### Phase 6: Review With the User in Lavish (mandatory)

Every course is handed over through [Lavish Editor](https://www.npmjs.com/package/lavish-axi), never as a bare file path. Lavish serves the course locally and lets the user read it, annotate any element or selected text, and send feedback back to you, so the course is reviewed and improved in place. Always run it through `npx` so the latest version is used:

1. **Serve:** `npx lavish-axi course-name/index.html`. The course directory already uses relative asset paths (`styles.css`, `main.js`, `vendor/katex/...`, `explorers/...`), which is what Lavish needs; never change them to `/`-rooted paths. Give the user the session URL it prints, together with a short summary of the course: the modules, the explorers, the page range covered and anything you could not cover.
2. **Wait for feedback:** `npx lavish-axi poll course-name/index.html`. It blocks silently until the user sends feedback or ends the session; that is normal, never kill it. Keep it in the foreground, unless your harness has a tracked background-job facility that is guaranteed to wake you when the poll returns. Never detach it with `nohup`, `&` or `disown`.
3. **Apply each round:** read the whole response (delivery consumes it). Each annotation names the element and text it is about; make the change in the source (`modules/*.html`, `explorers/*.js`, `_cover.html`), never in `index.html`, then run `bash build.sh` and the Phase 5 browser check again. A course change that fails the check is not ready to show. The same fidelity rules apply to fixes: the paper's notation, LaTeX, no emoji or callouts.
4. **Reply and keep listening:** write a short reply saying what you changed (and what you could not change, with the reason) and run `npx lavish-axi poll course-name/index.html --agent-reply-file reply.md`, which shows the reply on the page and waits for the next round. The user reloads the page to see the rebuilt course.
5. **Stop** when the poll reports that the user ended the session (`Send & End` delivers its final feedback once: apply it, then reply with `npx lavish-axi reply course-name/index.html --agent-reply-file reply.md`). Do not reopen an ended session unless the user asks. If the poll returns `browser_disconnected`, ask the user whether to reopen or end it.

Rules:
- Run `npx lavish-axi --help` once if anything is unclear; its help and its `next_step` output are the authority on its commands.
- Layout issues Lavish detects on its own wait in the user's inbox; change things for them only when they arrive as feedback the user queued.
- Never run `lavish-axi share`: it publishes the course on a public third-party host. Do it only if the user explicitly asks to share it.
- Lavish needs Node.js (`npx`). If `npx lavish-axi` cannot run, tell the user what is missing and give them the path to `index.html` as the fallback; do not install anything globally.
- In a non-interactive run (no user can answer), still serve the course and report the URL, but do not start the blocking poll.

---

## Design Identity

The visual design should feel like a **beautiful research notebook**: warm, inviting, academic but not cold. Read `references/design-system.md` for the full token system.

**Non-negotiable principles:**
- **Warm palette**: Off-white backgrounds, warm grays, no cold whites
- **Bold accent**: One confident accent color (vermillion, teal, amber; not purple gradients)
- **Distinctive typography**: Bricolage Grotesque for headings, DM Sans for body, JetBrains Mono for code
- **Generous whitespace**: Modules breathe. Max 3-4 short paragraphs per screen.
- **Alternating backgrounds**: Even/odd modules alternate between two warm tones
- **Dark code blocks**: IDE-style with Catppuccin syntax highlighting on #1E1E2E
- **SVG diagrams**: Use design system colors, responsive with viewBox, math labels in LaTeX
- **No decoration for its own sake**: no emoji, no callout boxes, no colored stripe borders

---

## Reference Files

The `references/` directory contains detailed specs. **Read them only when you reach the relevant phase.**

- **`references/content-philosophy.md`**: Teaching principles, notation fidelity, quiz design, tooltip rules. Read during Phase 3.5 and Phase 4.
- **`references/gotchas.md`**: Common failure points. Read during Phase 4 and Phase 5.
- **`references/interactive-demo.md`**: When and how to build explorers. Read in Phase 3 and when writing one.
- **`references/explorer-template.js`**: Starting point for each `explorers/<name>.js`.
- **`references/module-brief-template.md`**: Template for Phase 3.5 module briefs. Complex papers only.
- **`references/design-system.md`**: CSS tokens, color palette, typography, SVG conventions. Read during Phase 4.
- **`references/interactive-elements.md`**: HTML patterns for every element. Read the sections you need during Phase 4.

Scripts:
- **`scripts/new-course.sh <dir>`**: creates the course directory with every verbatim file in place.
- **`scripts/check-course.py <index.html>`**: the headless-browser check that gates "done".
- **`npx lavish-axi`** (external): serves the finished course for the user's review and returns their annotations (Phase 6).
