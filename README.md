# Paper-to-Course

**Turn any academic paper into a beautiful, interactive HTML tutorial.**

Give it a PDF or an arXiv URL. Get back a self-contained `index.html` with step-by-step math derivations, pseudocode walkthroughs, interactive experiments, quizzes, glossary tooltips, and research lineage trees. Open in any browser. No build tools, no server, no config.

<p align="center">
  <img src="onepage_output.png" alt="Paper-to-Course OnePage Overview" width="800">
</p>

---

## Why This Exists

Reading papers the traditional way goes like this: start from the top, get stuck on equation 3, skip to the conclusion, walk away with a vague memory of the abstract.

Paper-to-Course flips the order. **Intuition before formalism. Background before the paper's contribution. Questions before answers.** The learner builds a mental model of *why* the paper matters before confronting the math that formalizes it.

The target audience is "curious practitioners" — engineers, researchers, analysts who encounter papers in their work and need deep understanding, not surface skims.

---

## What You Get

A directory with a single `index.html` and supporting files:

```
your-paper-course/
  styles.css       # Design system (warm off-white, Catppuccin code blocks)
  main.js          # All interactive engines (IIFE, no dependencies)
  _base.html       # HTML shell (customized per course)
  _cover.html      # Hero section with paper metadata
  _footer.html     # Closing tags
  build.sh         # One-line assembly: cat parts → index.html
  modules/
    00-background.html   # Module 0: Prerequisites (always present)
    01-problem.html      # The problem the paper solves
    02-landscape.html    # Research landscape
    03-insight.html      # The key insight
    04-method.html       # Method details
    05-experiments.html  # Experiments & results
    06-implications.html # Implications & going further
  index.html       # Assembled output — open this
```

The only external dependencies are Google Fonts (Bricolage Grotesque, DM Sans, JetBrains Mono) and KaTeX CDN for math rendering. After the first load, the page works offline.

---

## 18 Interactive Element Types

Every course is built from these components. The CSS and JS live in `styles.css` and `main.js` — copied verbatim, no modifications needed.

| # | Element | What It Does |
|---|---------|-------------|
| 0 | Cover Page | Hero section with paper title, authors, abstract, "Start Learning" CTA |
| 1 | Math Derivation | Click-through step-by-step equations with KaTeX re-rendering |
| 2 | Pseudocode Walkthrough | Line-by-line highlighting with synced explanation panels |
| 3 | Result Comparison | Toggle metrics, animated bars, side-by-side numbers |
| 4 | Research Lineage Tree | Click nodes to expand related work details |
| 5 | Research Dialogue | Sequential message reveal (like a group chat between researchers) |
| 6 | SVG Diagrams | Inline, responsive, design-system-consistent visuals |
| 7 | Multiple-Choice Quizzes | Test application, not memorization. Wrong answers get explanations |
| 8 | Drag-and-Drop | Touch + mouse matching exercises with ghost elements |
| 9 | Spot the Assumption | Click-to-identify or quiz-style assumption challenges |
| 10 | Ablation Toggle | Toggle layers/components to see what changes |
| 11 | Callout Boxes | Key insights, warnings, "aha!" moments |
| 12 | Contribution Cards | Visual cards for paper contributions or concepts |
| 13 | Paper Citation Cards | Styled citation cards with one-sentence summaries |
| 14 | Flow Diagrams | JSON-driven animated step sequences with packet movement |
| 15 | Glossary Tooltips | `position: fixed` tooltips on every technical term |
| 16 | Step Cards | Numbered sequential steps with icons |
| 17 | Icon-Label Rows | Compact labeled icon rows for properties/methods |

---

## The 5-Phase Pipeline

### Phase 1: Deep Reading

The paper is read in three passes: skim for structure, extract equations/results/datasets, identify the narrative arc. The goal is to understand the paper well enough to teach it.

### Phase 2: Knowledge Expansion

WebSearch fills in prerequisite concepts, related work, and research context. What would a "curious practitioner" not know? What background does the paper assume?

### Phase 3: Curriculum Design

5–8 modules structured as a story: background → problem → landscape → key insight → method → experiments → results → implications. Module 0 (Background & Prerequisites) is mandatory. No approval step — the skill builds it directly.

### Phase 3.5: Module Briefs (complex papers)

For papers with 7+ modules, briefs are written first: teaching arc, pre-extracted equations, interactive element checklist, reference file sections. Enables parallel subagent dispatch.

### Phase 4: Build

Creates the output directory, copies `styles.css`, `main.js`, `_footer.html`, `build.sh` verbatim from references, customizes `_base.html` (title, accent color palette, nav dots, sidebar items), writes `_cover.html`, writes each module as a separate HTML file, then runs `build.sh` to assemble.

### Phase 5: Review & Open

Opens `index.html` and walks through a 15-item review checklist covering tooltips, math intuition, visual density, responsive layout, and more.

---

## Design System

Every course inherits the same visual language:

- **Colors**: Warm off-white backgrounds (`#FAF7F2`), 5 accent palettes (Vermillion `#D94F30` default, Coral, Teal, Amber, Forest), Catppuccin-inspired dark code blocks (`#1E1E2E`)
- **Typography**: Bricolage Grotesque (headings), DM Sans (body), JetBrains Mono (code/math)
- **Layout**: Sidebar navigation with scroll-sync, scroll-snap `y proximity`, progress bar
- **Responsive**: 1024px (sidebar collapses), 768px, 480px breakpoints
- **Animations**: fade-slide-up reveals, typing bounce, scroll-triggered stagger

Customize per course by picking an accent palette in `_base.html`. Everything else is automatic.

---

## Teaching Philosophy

- **Intuition first, then formalism** — every equation gets a plain-language explanation before the math
- **The paper's story** — each module is a chapter, not a section summary
- **50%+ visual** — max 2–3 sentences per text block, convert lists to cards, pipelines to flow diagrams
- **One concept per screen** — no walls of text
- **Question everything** — surface limitations, challenge assumptions, test application not recall
- **Knowledge expansion** — prerequisite concepts, research lineage, related work
- **Guided entry** — Module 0 gives learners the vocabulary before the paper's contribution
- **Bilingual glossary** — format: `Chinese explanation (English Term)`

---

## How to Use

This is a [Claude Code](https://docs.anthropic.com/en/docs/claude-code) skill. After installing it in `~/.claude/skills/`, use any trigger phrase:

**English:**
- "turn this paper into a course"
- "explain this paper interactively"
- "make a tutorial from this paper"
- "teach me this paper"
- "interactive walkthrough of this research"
- "convert this PDF to a tutorial"

Provide a paper source:
- Local PDF: `"turn ./paper.pdf into a course"`
- arXiv URL: `"make a tutorial from https://arxiv.org/abs/xxxx.xxxxx"`
- DOI: resolve automatically via web fetch

The skill handles everything. Open the generated `index.html` in your browser when it's done.

---

## Language

Default output: **Simplified Chinese**. Auto-detects user input language and switches. Glossary tooltips are bilingual: `Explanation in the course language (English Term)`.

---

## Project Structure

```
paper-to-course/
  SKILL.md                              # Main skill definition (5-phase pipeline)
  README.md                             # This file
  references/
    styles.css                          # ~2,000 lines CSS design system
    main.js                             # ~777 lines interactive JS engines
    _base.html                          # HTML shell template
    _footer.html                        # Closing tags
    build.sh                            # Assembly script (cat → index.html)
    design-system.md                    # Design tokens documentation
    interactive-elements.md             # HTML patterns for 17 element types
    content-philosophy.md               # Teaching principles & quiz philosophy
    gotchas.md                          # 20 common failure points
    module-brief-template.md            # Template for parallel module writing
```

---

## Credits

Inspired by [codebase-to-course](https://github.com/zarazhangrui/codebase-to-course) by Zara (@zarazhangrui).

---

## License

[Apache License 2.0](LICENSE)
