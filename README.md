# paper-course

A Claude Code skill that turns an academic paper into an interactive HTML course: step-by-step LaTeX derivations in the paper's own notation, pseudocode walkthroughs, quizzes, glossary tooltips, research lineage, and small working simulations ("explorers") of the paper's mechanisms. The result is a directory with an `index.html` that opens from disk.

This is a fork of [ZeroxZhang/paper-to-course](https://github.com/ZeroxZhang/paper-to-course) (Apache-2.0). See `NOTICE` for attribution and `git log` for every change since the fork point.

## What changed from upstream

- **Working page out of the box.** Upstream's `main.js` threw a `ReferenceError` on load (the sidebar list was used before it was declared), which killed every widget in every generated course. That and other engine bugs are fixed (pseudocode buttons that were never wired, math not rendered in tooltips and quiz feedback, ablation layers looked up globally, drag-and-drop losing math).
- **A browser check gates "done".** `scripts/check-course.py` loads the built course in Playwright's headless Chromium, clicks through every widget and fails on console errors, dead widgets, KaTeX errors, raw LaTeX, unfilled placeholders, nav mismatches, emoji, callouts and stripe borders. `tests/run.sh` tests the skill itself.
- **Interactive explorers.** An optional component and module (`references/interactive-demo.md`, `references/explorer-template.js`) for simulating the paper's own mechanism, with live checks of the paper's invariants. The idea comes from [claude-paper](https://github.com/alaliqing/claude-paper)'s interactive explorer.
- **Fidelity and LaTeX.** The paper's notation is reproduced exactly everywhere, including diagrams (math labels in `<foreignObject>`), and all math is LaTeX. KaTeX is bundled locally (`references/vendor/katex`), no CDN.
- **No callouts, no stripe borders, no emoji.** The callout component is gone; key points use a typographic `.key-idea`.
- **English skill, user's-language output.** All Chinese text in the skill is translated; the course is written in the language the user writes in, with the engine's UI strings overridable per course.
- **Cheaper runs.** `scripts/new-course.sh` copies the large CSS/JS files instead of having the model re-type them.

## Layout

```
SKILL.md                         the skill instructions
references/
  content-philosophy.md          teaching principles, notation fidelity, quizzes, tooltips
  gotchas.md                     failure modes to check
  interactive-elements.md        HTML pattern for every component
  interactive-demo.md            when and how to build explorers
  explorer-template.js           starting point for explorers/<name>.js
  design-system.md               tokens, typography, SVG conventions
  module-brief-template.md       per-module brief for complex papers
  _base.html _footer.html build.sh styles.css main.js
  vendor/katex/                  KaTeX 0.16.47 (MIT), woff2 fonts only
scripts/
  new-course.sh                  scaffold a course directory
  check-course.py                headless browser check
tests/
  run.sh                         fixture that must pass + broken fixture that must fail
```

## Usage

Install the skill directory where your agent loads skills (for example a project's `.claude/skills/paper-course/`), then ask: "turn ./paper.pdf into a course". The check needs `uv` (or a local venv with `playwright`) and Playwright's Chromium (`uv run --no-project --with playwright playwright install chromium`).

## License

Apache License 2.0, as upstream. See `LICENSE` and `NOTICE`.
