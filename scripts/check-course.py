#!/usr/bin/env python3
"""Load a built course in a headless browser and fail if anything is broken.

Usage:
  uv run --no-project --with playwright python scripts/check-course.py <course>/index.html [--screenshot out.png]

Uses Playwright's own bundled Chromium (headless). If it is missing, install
it once with: uv run --no-project --with playwright playwright install chromium
Never point this at a personal browser installation.

Fails (exit 1) on:
  - any console error, uncaught exception, or failed local file load
  - main.js not finishing, or a widget that never initialized
  - KaTeX missing, KaTeX parse errors, or raw LaTeX left as visible text
  - unfilled template placeholders
  - nav dots / sidebar items not matching the modules
  - a widget that does not respond to a click (derivations, pseudocode,
    chat, quizzes, explorers, ablation tabs, metric toggles, tooltips)
  - emoji anywhere in the page text or tooltips
  - a callout component or any colored left-stripe box
  - scroll snapping, or an arrow-key handler that jumps the page
  - losing the reader's position on reload
  - text clipped inside an SVG <foreignObject> label (box too small)
Warns (exit 0) on: CJK text in a course whose lang is not zh/ja/ko,
modules without any interactive element, missing cover page.
"""
import argparse
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

STATIC_CHECKS_JS = r"""
() => {
  const errors = [], warnings = [], stats = {};
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  if (!(window.PaperCourse && window.PaperCourse.ready)) errors.push('main.js did not finish (window.PaperCourse.ready is not set)');
  if (typeof window.renderMathInElement !== 'function') errors.push('KaTeX auto-render is not loaded (vendor/katex missing?)');

  const html = document.documentElement.outerHTML;
  ['COURSE_TITLE', 'COURSE_LANG', 'COURSE_UI_STRINGS', 'ACCENT_COLOR', 'ACCENT_HOVER', 'ACCENT_LIGHT', 'ACCENT_MUTED', 'NAV_DOTS', 'SIDEBAR_ITEMS']
    .forEach(p => { if (html.includes(p)) errors.push('unfilled placeholder: ' + p); });

  const lang = (document.documentElement.lang || '').toLowerCase();
  if (!lang) errors.push('<html lang> is empty');

  // Navigation consistency
  const modules = $$('.module'), dots = $$('.nav-dot'), items = $$('.sidebar-item');
  stats.modules = modules.length;
  if (!modules.length) errors.push('no .module sections found');
  if (dots.length !== modules.length) errors.push(`nav dots (${dots.length}) != modules (${modules.length})`);
  if (items.length !== modules.length) errors.push(`sidebar items (${items.length}) != modules (${modules.length})`);
  dots.forEach(d => { if (!document.getElementById(d.dataset.target || '')) errors.push('nav dot points at missing #' + d.dataset.target); });
  items.forEach(i => { const h = i.getAttribute('href') || ''; if (!h.startsWith('#') || !document.querySelector(h)) errors.push('sidebar item points at missing ' + h); });
  if (!document.querySelector('.course-cover')) warnings.push('no .course-cover section');
  if (document.querySelector('.course-cover.module')) errors.push('.course-cover must not also be a .module');

  // Ids must be unique (widgets are wired by id)
  const seen = {};
  $$('[id]').forEach(e => { seen[e.id] = (seen[e.id] || 0) + 1; });
  Object.keys(seen).filter(k => seen[k] > 1).forEach(k => errors.push(`duplicate id "${k}" (${seen[k]} times)`));

  // Widgets that never initialized
  const widgetSel = ['.math-derivation', '.pseudocode-translation', '.chat-window', '.quiz-container', '.dnd-container',
    '.result-comparison', '.flow-animation', '[data-explorer]', '.lineage-tree', '.ablation-demo', '.layer-demo',
    '.assumption-challenge', '.bug-challenge', '.term'];
  widgetSel.forEach(sel => {
    const all = $$(sel);
    stats[sel] = all.length;
    all.filter(w => !w.dataset.pcReady).forEach(w => errors.push(`widget never initialized: ${sel}${w.id ? '#' + w.id : ''}`));
  });
  $$('.explorer').filter(e => !e.dataset.explorer).forEach(e => errors.push('.explorer without data-explorer' + (e.id ? ' #' + e.id : '')));

  // Math
  stats.katex = $$('.katex').length;
  $$('.katex-error').forEach(e => errors.push('KaTeX parse error: ' + (e.getAttribute('title') || e.textContent).slice(0, 160)));
  const rawTex = /(\$\$?[^$\n]{1,200}?\$\$?)|\\\(|\\\[|\\(frac|mathbb|mathcal|alpha|beta|gamma|delta|Gamma|Delta|phi|varphi|circ|sum|int|to|mapsto|times|langle|rangle|left|right|text|mathrm|operatorname)\b/;
  const skip = 'script,style,code,pre,textarea,.katex';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const texHits = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    const p = n.parentElement;
    if (!p || p.closest(skip)) continue;
    const m = n.textContent.match(rawTex);
    if (m) texHits.push(n.textContent.trim().slice(0, 120));
  }
  texHits.slice(0, 15).forEach(t => errors.push('raw LaTeX left as text: "' + t + '"'));
  if (texHits.length > 15) errors.push(`... and ${texHits.length - 15} more raw LaTeX fragments`);

  // Emoji (pictographs, not ordinary symbols such as arrows or the trademark sign)
  const isEmoji = ch => {
    const cp = ch.codePointAt(0);
    if (cp === 0xFE0F || cp === 0x20E3) return true;
    if (!/\p{Extended_Pictographic}/u.test(ch)) return false;
    return cp >= 0x1F000 || (cp >= 0x2600 && cp <= 0x27BF) || (cp >= 0x2B00 && cp <= 0x2BFF) || (cp >= 0x2300 && cp <= 0x23FF);
  };
  const emojiIn = s => Array.from(s || '').filter(isEmoji);
  const emojiHits = new Set();
  emojiIn(document.body.innerText).forEach(c => emojiHits.add(c));
  $$('[data-definition],[data-explanation-right],[data-explanation-wrong],[data-detail],[data-desc],[title],[data-steps]').forEach(e => {
    Array.from(e.attributes).forEach(a => emojiIn(a.value).forEach(c => emojiHits.add(c)));
  });
  if (emojiHits.size) errors.push('emoji found: ' + Array.from(emojiHits).join(' '));

  // Callouts and left-stripe boxes
  $$('.callout, [class*="callout-"]').forEach(e => errors.push('callout component used (forbidden): ' + e.className));
  $$('body *').forEach(e => {
    if (e.closest('.lineage-tree') || e.closest('svg') || e.closest('.katex')) return;
    const cs = getComputedStyle(e);
    const l = parseFloat(cs.borderLeftWidth), t = parseFloat(cs.borderTopWidth), r = parseFloat(cs.borderRightWidth);
    if (l >= 2 && l > t + 0.5 && l > r + 0.5 && cs.borderLeftStyle !== 'none') {
      const bg = cs.backgroundColor;
      const filled = bg && bg !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(bg);
      if (filled || parseFloat(cs.paddingLeft) > 0) errors.push('left-stripe box (forbidden style): <' + e.tagName.toLowerCase() + ' class="' + e.className + '">');
    }
  });

  // Text clipped inside diagram labels (foreignObject content larger than its box)
  $$('svg foreignObject').forEach(fo => {
    const w = fo.width.baseVal.value, h = fo.height.baseVal.value;
    Array.from(fo.children).forEach(c => {
      if (c.scrollHeight > h + 2 || c.scrollWidth > w + 2) {
        const svg = fo.closest('svg'), mod = fo.closest('.module');
        errors.push(`diagram label clipped (content ${c.scrollWidth}x${c.scrollHeight} > box ${Math.round(w)}x${Math.round(h)})` +
          (mod ? ` in #${mod.id}` : '') + ': "' + (c.innerText || c.textContent).trim().replace(/\s+/g, ' ').slice(0, 60) + '"');
      }
    });
  });

  // Clickable non-native elements must stay clickable in Lavish's annotate mode
  const clickable = $$('.sidebar-item, .course-cover-cta, .lineage-node, .term, .dnd-chip, .dnd-zone-target, .explorer-stage [data-action]');
  const unmarked = clickable.filter(e => !e.hasAttribute('data-lavish-action'));
  if (unmarked.length) errors.push(`${unmarked.length} clickable elements lack data-lavish-action, so Lavish's annotate mode swallows their clicks (first: ${unmarked[0].className})`);

  // Scrolling must stay native
  [document.documentElement, document.body].forEach(el => {
    const snap = getComputedStyle(el).scrollSnapType;
    if (snap && snap !== 'none') errors.push(`scroll snapping on <${el.tagName.toLowerCase()}> (${snap}) makes long modules jump`);
  });

  // Language leakage
  if (!/^(zh|ja|ko)/.test(lang)) {
    const cjk = (document.body.innerText.match(/[\u3000-\u303f\u3040-\u30ff\u4e00-\u9fff\uff00-\uffef]+/g) || []);
    if (cjk.length) warnings.push(`CJK text in a lang="${lang}" course: ` + cjk.slice(0, 8).join(' '));
  }

  modules.forEach(m => {
    const interactive = m.querySelector(widgetSel.filter(s => s !== '.term').join(','));
    if (!interactive) warnings.push(`module #${m.id} has no interactive element`);
  });
  return { errors, warnings, stats };
}
"""

INTERACTION_JS = r"""
async () => {
  const errors = [], done = {};
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const visible = e => e && getComputedStyle(e).display !== 'none';
  const name = (e, sel) => sel + (e.id ? '#' + e.id : '');

  for (const d of $$('.math-derivation')) {
    const steps = $$('.math-step', d);
    const hidden = steps.filter(s => !visible(s)).length;
    if (hidden) errors.push(name(d, '.math-derivation') + `: ${hidden} of ${steps.length} lines are hidden; a derivation is shown whole`);
    const btn = d.querySelector('.math-next-btn');
    if (btn) {
      btn.click();
      if (!d.querySelector('.math-step.current')) errors.push(name(d, '.math-derivation') + ': "next" highlighted no line');
      const reset = d.querySelector('.math-reset-btn'); if (reset) reset.click();
    }
    done.derivations = (done.derivations || 0) + 1;
  }

  for (const p of $$('.pseudocode-translation')) {
    const wrap = p.closest('.pseudocode-walkthrough');
    const sib = p.nextElementSibling;
    const scope = p.querySelector('.pseudocode-controls') || (wrap && wrap.querySelector('.pseudocode-controls')) || (sib && sib.classList.contains('pseudocode-controls') ? sib : p);
    const btn = scope.querySelector('.pseudocode-next-btn');
    if (!btn) { errors.push(name(p, '.pseudocode-translation') + ': no next button'); continue; }
    btn.click();
    if (!p.querySelector('.pseudocode-line.highlighted')) errors.push(name(p, '.pseudocode-translation') + ': "next" did not highlight a line');
    const reset = scope.querySelector('.pseudocode-reset-btn'); if (reset) reset.click();
    done.pseudocode = (done.pseudocode || 0) + 1;
  }

  for (const c of $$('.chat-window')) {
    const btn = c.querySelector('.chat-next-btn');
    if (!btn) { errors.push(name(c, '.chat-window') + ': no next button'); continue; }
    btn.click();
    await sleep(750);
    if (!$$('.chat-message', c).some(visible)) errors.push(name(c, '.chat-window') + ': "next" showed no message');
    const reset = c.querySelector('.chat-reset-btn'); if (reset) reset.click();
    done.chats = (done.chats || 0) + 1;
  }

  for (const q of $$('.quiz-container')) {
    const blocks = $$('.quiz-question-block', q);
    blocks.forEach(b => { const o = b.querySelector('.quiz-option'); if (o) o.click(); });
    const check = q.querySelector('.quiz-check-btn');
    if (!check) { errors.push(name(q, '.quiz-container') + ': no check button'); continue; }
    blocks.forEach(b => { if (!b.dataset.correct) errors.push(name(q, '.quiz-container') + ': a question has no data-correct'); });
    blocks.forEach(b => {
      const vals = $$('.quiz-option', b).map(o => o.dataset.value);
      if (b.dataset.correct && !vals.includes(b.dataset.correct)) errors.push(name(q, '.quiz-container') + `: data-correct="${b.dataset.correct}" matches no option`);
    });
    check.click();
    blocks.forEach(b => { const f = b.querySelector('.quiz-feedback'); if (!f || !f.classList.contains('show')) errors.push(name(q, '.quiz-container') + ': checking gave no feedback'); });
    const reset = q.querySelector('.quiz-reset-btn'); if (reset) reset.click();
    done.quizzes = (done.quizzes || 0) + 1;
  }

  for (const a of $$('.assumption-challenge')) {
    const o = a.querySelector('.assumption-option'); if (o) o.click();
    const check = a.querySelector('.quiz-check-btn');
    if (check) {
      check.click();
      const f = a.querySelector('.assumption-feedback');
      if (!f || !f.classList.contains('show')) errors.push(name(a, '.assumption-challenge') + ': checking gave no feedback');
    }
    done.assumptions = (done.assumptions || 0) + 1;
  }

  for (const x of $$('[data-explorer]')) {
    if (!x.dataset.pcReady) continue;
    const label = 'explorer "' + x.dataset.explorer + '"';
    const buttons = $$('.explorer-action', x);
    if (!buttons.length) errors.push(label + ': no action buttons');
    let responded = 0;
    for (const b of buttons) {
      if (b.disabled) continue;
      const logBefore = x.querySelector('.explorer-log').innerHTML;
      const msgBefore = x.querySelector('.explorer-message').textContent;
      b.click();
      await sleep(20);
      const changed = x.querySelector('.explorer-log').innerHTML !== logBefore || x.querySelector('.explorer-message').textContent !== msgBefore;
      if (changed) responded++;
      else errors.push(label + ': action "' + b.textContent.trim().slice(0, 60) + '" changed nothing');
    }
    for (const t of $$('.explorer-stage [data-action]', x).slice(0, 3)) { t.click(); await sleep(20); }
    $$('.explorer-params input, .explorer-params select', x).forEach(i => { i.dispatchEvent(new Event('input')); });
    const back = x.querySelector('.explorer-back-btn'); if (back && !back.disabled) back.click();
    const reset = x.querySelector('.explorer-reset-btn'); if (reset) reset.click();
    if (x.querySelector('.explorer-stage').innerHTML.trim() === '') errors.push(label + ': stage is empty after reset');
    done.explorers = (done.explorers || 0) + 1;
  }

  for (const d of $$('.ablation-demo, .layer-demo')) {
    for (const tab of $$('.ablation-tab, .layer-tab', d)) {
      tab.click();
      const shown = $$('.ablation-layer, .layer', d).filter(visible);
      if (shown.length !== 1) errors.push(name(d, '.ablation-demo') + ': tab "' + tab.textContent.trim() + '" shows ' + shown.length + ' layers');
    }
    done.ablations = (done.ablations || 0) + 1;
  }

  for (const r of $$('.result-comparison')) {
    for (const m of $$('.result-metric', r)) {
      m.click();
      $$('.result-value', r).forEach(v => { if (!v.textContent.trim() || /NaN|undefined/.test(v.textContent)) errors.push('result comparison: bad value "' + v.textContent + '" for metric ' + m.dataset.metric); });
    }
    done.results = (done.results || 0) + 1;
  }

  // Arrow keys must scroll natively, not jump a whole module
  {
    const mid = Math.max(0, (document.documentElement.scrollHeight - innerHeight) / 2);
    window.scrollTo({ top: mid, behavior: 'instant' });
    await sleep(50);
    const y0 = scrollY;
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    await sleep(700);
    if (Math.abs(scrollY - y0) > innerHeight) errors.push(`ArrowDown moved the page ${Math.round(scrollY - y0)}px: a key handler is hijacking scrolling`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  const term = document.querySelector('.term');
  if (term) {
    term.dispatchEvent(new MouseEvent('mouseenter'));
    await sleep(60);
    const tip = document.querySelector('.term-tooltip.visible');
    if (!tip) errors.push('tooltip did not appear on hover');
    else if (!tip.textContent.trim()) errors.push('tooltip is empty (missing data-definition?)');
    term.dispatchEvent(new MouseEvent('mouseleave'));
    $$('.term').filter(t => !(t.dataset.definition || '').trim()).forEach(t => errors.push('term without data-definition: "' + t.textContent.trim() + '"'));
    done.tooltips = $$('.term').length;
  }
  return { errors, done };
}
"""


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("index", help="path to the built index.html")
    ap.add_argument("--screenshot", help="also save a full-page screenshot here")
    ap.add_argument("--shots", help="also save one screenshot per diagram and explorer into this directory, to inspect labels and overlaps")
    ap.add_argument("--json", action="store_true", help="print the result as JSON")
    args = ap.parse_args()

    path = pathlib.Path(args.index).resolve()
    if not path.is_file():
        print(f"FAIL: {path} does not exist (run build.sh first)")
        return 1

    console_errors, failed_loads = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"uncaught: {e}"))
        page.on("requestfailed", lambda r: failed_loads.append(r.url) if r.url.startswith("file:") else None)
        page.goto(path.as_uri(), wait_until="load")
        page.wait_for_timeout(400)
        static = page.evaluate(STATIC_CHECKS_JS)
        interaction = page.evaluate(INTERACTION_JS)
        page.wait_for_timeout(200)

        # Reading position must survive a reload
        page.evaluate("window.scrollTo({top: Math.round((document.documentElement.scrollHeight - innerHeight) * 0.6), behavior: 'instant'})")
        page.wait_for_timeout(600)
        before = page.evaluate("scrollY")
        page.reload(wait_until="load")
        page.wait_for_timeout(700)
        after = page.evaluate("scrollY")
        if before > 0 and abs(after - before) > 200:
            interaction["errors"].append(f"reading position lost on reload (was at {round(before)}px, came back at {round(after)}px)")
        page.evaluate("window.scrollTo({top: 0, behavior: 'instant'})")
        page.wait_for_timeout(300)

        if args.screenshot or args.shots:
            page.evaluate("document.querySelectorAll('.animate-in').forEach(e => e.classList.add('visible'))")
            page.wait_for_timeout(300)
        if args.screenshot:
            page.screenshot(path=args.screenshot, full_page=True)
        if args.shots:
            out = pathlib.Path(args.shots)
            out.mkdir(parents=True, exist_ok=True)
            items = page.locator(".svg-diagram, .explorer")
            for i in range(items.count()):
                items.nth(i).screenshot(path=str(out / f"{i:02d}.png"))
            print(f"  saved {items.count()} diagram/explorer screenshots in {out}")
        browser.close()

    errors = [f"console: {e}" for e in console_errors]
    errors += [f"failed to load: {u}" for u in failed_loads]
    errors += static["errors"] + interaction["errors"]
    warnings = static["warnings"]

    if args.json:
        print(json.dumps({"ok": not errors, "errors": errors, "warnings": warnings,
                          "stats": static["stats"], "exercised": interaction["done"]}, indent=2, ensure_ascii=False))
    else:
        stats = {k: v for k, v in static["stats"].items() if v}
        print(f"Checked {path}")
        print("  found:     " + ", ".join(f"{k}={v}" for k, v in stats.items()))
        print("  exercised: " + (", ".join(f"{k}={v}" for k, v in interaction["done"].items()) or "nothing"))
        for w in warnings:
            print(f"  WARN  {w}")
        for e in errors:
            print(f"  FAIL  {e}")
        print("RESULT: " + ("FAIL" if errors else "PASS") + f" ({len(errors)} errors, {len(warnings)} warnings)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
