/**
 * NEOPAPER — COMPLETE JS ENGINE
 * Copied verbatim into the course output directory by scripts/new-course.sh.
 * Never regenerate it. It handles all interactivity generically.
 *
 * Engines included:
 *  - UI strings (English defaults, overridable per course)
 *  - KaTeX rendering (bundled locally, see vendor/katex)
 *  - Navigation, progress bar and sidebar
 *  - Scroll-triggered reveal animations
 *  - Glossary tooltips
 *  - Quiz (multiple-choice & scenario)
 *  - Drag-and-drop matching
 *  - Group chat / research dialogue animation
 *  - Data flow / message flow animation
 *  - Architecture diagram
 *  - "Spot the bug" / "Spot the assumption" challenge
 *  - Layer toggle / ablation toggle
 *  - Derivation / proof, whole, explained line by line
 *  - Pseudocode walkthrough
 *  - Result comparison
 *  - Research lineage tree
 *  - Interactive explorer (paper-specific simulations, see explorer-template.js)
 *  - Reading position (kept across reloads)
 *
 * Every engine runs inside safeInit(): a failure in one widget is logged with
 * console.error (so scripts/check-course.py fails the build) but never stops
 * the other widgets from initializing. Every initialized widget root gets
 * data-pc-ready="1", which the checker uses to find dead widgets.
 */
(function () {
  'use strict';

  /* ── HELPERS ──────────────────────────────────────────────── */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  const PC = window.PaperCourse = window.PaperCourse || {};

  function safeInit(name, fn) {
    try { fn(); }
    catch (e) { console.error('[neopaper] ' + name + ' failed to initialize:', e); }
  }
  function markReady(el) { if (el) el.setAttribute('data-pc-ready', '1'); }

  // Courses are reviewed in Lavish Editor, whose annotate mode turns clicks
  // on links and custom clickable elements into annotations. Native buttons,
  // inputs and selects pass through on their own; everything else that is
  // meant to be clicked carries data-lavish-action so it keeps working while
  // the reader annotates. Harmless outside Lavish.
  const CLICKABLE = '.sidebar-item, .course-cover-cta, .lineage-node, .term, .dnd-chip, .dnd-zone-target, .arch-component, .bug-line, .explorer-stage [data-action]';
  function markClickable(root) {
    $$(CLICKABLE, root).forEach(el => el.setAttribute('data-lavish-action', ''));
  }
  PC.markClickable = markClickable;

  /* ── UI STRINGS ───────────────────────────────────────────── */
  // English defaults. A course in another language overrides any subset with
  // <script type="application/json" id="course-ui">{...}</script> in _base.html.
  const UI_DEFAULTS = {
    pickAnswer:      'Pick an answer first.',
    correct:         'Correct.',
    notQuite:        'Not quite.',
    found:           'Found it.',
    notThisLine:     'Not this one, keep looking.',
    dropHere:        'Drop here',
    step:            'Step {n} / {total}',
    flowStart:       'Press "Next" to start',
    explorerBack:    'Step back',
    explorerReset:   'Reset',
    explorerHistory: 'History',
    explorerChecks:  'Checks',
    explorerNoSteps: 'No actions yet.',
    explorerHolds:   'holds',
    explorerFails:   'fails',
    explorerStart:   'start'
  };
  const UI = Object.assign({}, UI_DEFAULTS);
  safeInit('UI strings', () => {
    const el = document.getElementById('course-ui');
    if (el && el.textContent.trim()) Object.assign(UI, JSON.parse(el.textContent));
  });
  function t(key, vars) {
    let s = UI[key] != null ? String(UI[key]) : key;
    if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  PC.t = t;

  /* ── KATEX ────────────────────────────────────────────────── */
  const KATEX_OPTS = {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\[', right: '\\]', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false }
    ],
    // Parse errors are reported (console.error fails the browser check) and
    // the source is left visible, instead of being silently drawn in red.
    throwOnError: true,
    errorCallback: function (msg, err) {
      console.error('[neopaper] KaTeX could not parse: ' + msg + ' ' + (err && err.message ? err.message : ''));
    }
  };
  function renderMath(el) {
    if (el && typeof window.renderMathInElement === 'function') {
      window.renderMathInElement(el, KATEX_OPTS);
    }
  }
  PC.renderMath = renderMath;
  safeInit('KaTeX', () => {
    if (typeof window.renderMathInElement !== 'function') {
      console.error('[neopaper] KaTeX is not loaded: check that vendor/katex/ was copied next to index.html.');
      return;
    }
    renderMath(document.body);
  });

  /* ── NAVIGATION, PROGRESS BAR & SIDEBAR ───────────────────── */
  // All lookups happen before the first updateProgress() call. Upstream
  // declared sidebarItems after that call, which threw a TDZ ReferenceError
  // and killed every engine below it.
  const progressBar   = $('#progress-bar');
  const navDots       = $$('.nav-dot');
  const modules       = $$('.module');
  const sidebarItems  = $$('.sidebar-item');
  const sidebarToggle = $('#sidebar-toggle');
  const sidebar       = $('#sidebar');
  let sidebarOverlay  = null;

  function markCurrent(items) {
    const scrollMid = window.scrollY + window.innerHeight / 2;
    modules.forEach((mod, i) => {
      const item = items[i];
      if (!item) return;
      const top    = mod.offsetTop;
      const bottom = top + mod.offsetHeight;
      if (scrollMid >= top && scrollMid < bottom) {
        item.classList.add('active');
        item.classList.remove('visited');
      } else if (window.scrollY + window.innerHeight > top) {
        item.classList.remove('active');
        item.classList.add('visited');
      } else {
        item.classList.remove('active', 'visited');
      }
    });
  }

  function updateProgress() {
    if (progressBar) {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
      progressBar.setAttribute('aria-valuenow', Math.round(pct));
    }
    markCurrent(navDots);
    markCurrent(sidebarItems);
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'false');
    if (sidebarOverlay) sidebarOverlay.classList.remove('visible');
  }

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'true');
    if (!sidebarOverlay) {
      sidebarOverlay = document.createElement('div');
      sidebarOverlay.className = 'sidebar-overlay';
      document.body.appendChild(sidebarOverlay);
      sidebarOverlay.addEventListener('click', closeSidebar);
    }
    sidebarOverlay.classList.add('visible');
  }

  safeInit('navigation', () => {
    window.addEventListener('scroll', () => requestAnimationFrame(updateProgress), { passive: true });
    updateProgress();

    navDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const target = document.getElementById(dot.dataset.target);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      });
    });

    sidebarItems.forEach(item => {
      item.addEventListener('click', e => {
        const target = $(item.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
        if (window.innerWidth <= 1024) closeSidebar();
      });
    });

    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        sidebar && sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
      });
    }

    const coverCta = $('.course-cover-cta');
    if (coverCta) {
      coverCta.addEventListener('click', e => {
        e.preventDefault();
        if (modules[0]) modules[0].scrollIntoView({ behavior: 'smooth' });
      });
    }
  });

  // No keyboard hijacking: upstream bound the arrow keys to jump a whole
  // module, so ArrowDown skipped thousands of pixels of a long module. The
  // browser's own arrow, Page and Space scrolling is what readers expect;
  // the nav dots and sidebar handle module jumps.

  /* ── SCROLL-TRIGGERED REVEAL ───────────────────────────────── */
  safeInit('reveal animations', () => {
    document.body.classList.add('js-reveal');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px', threshold: 0 });
    $$('.animate-in').forEach(el => revealObserver.observe(el));
    $$('.stagger-children').forEach(parent => {
      Array.from(parent.children).forEach((child, i) => child.style.setProperty('--stagger-index', i));
    });
  });

  /* ── GLOSSARY TOOLTIPS ─────────────────────────────────────── */
  let activeTooltip = null;

  function positionTooltip(term, tip) {
    const rect     = term.getBoundingClientRect();
    const tipWidth = Math.min(320, Math.max(200, window.innerWidth * 0.8));
    let left = rect.left + rect.width / 2 - tipWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipWidth - 8));
    tip.style.left  = left + 'px';
    tip.style.width = tipWidth + 'px';
    document.body.appendChild(tip);
    const tipHeight = tip.offsetHeight;
    if (rect.top - tipHeight - 12 < 0) {
      tip.style.top = (rect.bottom + 8) + 'px';
      tip.classList.add('flip');
    } else {
      tip.style.top = (rect.top - tipHeight - 8) + 'px';
      tip.classList.remove('flip');
    }
  }

  function showTooltip(term, tip) {
    if (activeTooltip && activeTooltip !== tip) {
      activeTooltip.classList.remove('visible');
      activeTooltip.remove();
    }
    positionTooltip(term, tip);
    requestAnimationFrame(() => tip.classList.add('visible'));
    activeTooltip = tip;
  }

  function hideTooltip(tip) {
    tip.classList.remove('visible');
    setTimeout(() => { if (!tip.classList.contains('visible')) tip.remove(); }, 150);
    if (activeTooltip === tip) activeTooltip = null;
  }

  safeInit('glossary tooltips', () => {
    $$('.term').forEach(term => {
      const tip = document.createElement('span');
      tip.className = 'term-tooltip';
      tip.textContent = term.dataset.definition || '';
      renderMath(tip); // definitions may contain $...$
      term.addEventListener('mouseenter', () => showTooltip(term, tip));
      term.addEventListener('mouseleave', () => hideTooltip(tip));
      term.addEventListener('click', e => {
        e.stopPropagation();
        tip.classList.contains('visible') ? hideTooltip(tip) : showTooltip(term, tip);
      });
      markReady(term);
    });
    document.addEventListener('click', () => {
      if (activeTooltip) { activeTooltip.classList.remove('visible'); activeTooltip.remove(); activeTooltip = null; }
    });
  });

  /* ── FEEDBACK HELPER ───────────────────────────────────────── */
  function setFeedback(el, baseClass, kind, lead, text) {
    if (!el) return;
    el.textContent = '';
    if (lead) {
      const strong = document.createElement('strong');
      strong.textContent = lead;
      el.appendChild(strong);
      el.appendChild(document.createTextNode(' '));
    }
    const span = document.createElement('span');
    span.textContent = text || '';
    el.appendChild(span);
    renderMath(el);
    el.className = baseClass + ' show ' + kind;
  }

  /* ── QUIZ ENGINE ───────────────────────────────────────────── */
  window.selectOption = function (btn) {
    const block = btn.closest('.quiz-question-block');
    $$('.quiz-option', block).forEach(o => o.classList.remove('selected'));
    btn.classList.add('selected');
  };

  window.checkQuiz = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) { console.error('[neopaper] checkQuiz: no element #' + containerId); return; }
    $$('.quiz-question-block', container).forEach(q => {
      const selected = $('.quiz-option.selected', q);
      const feedback = $('.quiz-feedback', q);
      const correct  = q.dataset.correct;
      if (!selected) { setFeedback(feedback, 'quiz-feedback', 'warning', '', t('pickAnswer')); return; }
      $$('.quiz-option', q).forEach(o => o.disabled = true);
      if (selected.dataset.value === correct) {
        selected.classList.add('correct');
        setFeedback(feedback, 'quiz-feedback', 'success', t('correct'), q.dataset.explanationRight);
      } else {
        selected.classList.add('incorrect');
        const correctBtn = $(`.quiz-option[data-value="${correct}"]`, q);
        if (correctBtn) correctBtn.classList.add('correct');
        setFeedback(feedback, 'quiz-feedback', 'error', t('notQuite'), q.dataset.explanationWrong);
      }
    });
  };

  window.resetQuiz = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    $$('.quiz-option', container).forEach(o => {
      o.classList.remove('selected', 'correct', 'incorrect');
      o.disabled = false;
    });
    $$('.quiz-feedback', container).forEach(f => { f.className = 'quiz-feedback'; f.textContent = ''; });
  };

  safeInit('quizzes', () => $$('.quiz-container').forEach(markReady));

  /* ── DRAG-AND-DROP ENGINE ──────────────────────────────────── */
  function placeChip(target, chip, answer) {
    target.innerHTML = chip.innerHTML; // keeps rendered math
    target.dataset.placed = answer;
    target.classList.remove('correct-placed', 'incorrect-placed');
    chip.classList.add('placed');
  }

  function initDnD(containerEl) {
    const chips = $$('.dnd-chip', containerEl);
    const zones = $$('.dnd-zone', containerEl);

    zones.forEach(zone => {
      const target = $('.dnd-zone-target', zone);
      if (!target) return;
      target.dataset.placeholder = target.textContent.trim() || t('dropHere');
      target.addEventListener('dragover',  e => { e.preventDefault(); target.classList.add('drag-over'); });
      target.addEventListener('dragleave', ()  => target.classList.remove('drag-over'));
      target.addEventListener('drop', e => {
        e.preventDefault();
        target.classList.remove('drag-over');
        const answer = e.dataTransfer.getData('text/plain');
        const chip   = $(`.dnd-chip[data-answer="${answer}"]`, containerEl);
        if (chip) placeChip(target, chip, answer);
      });
    });

    chips.forEach(chip => {
      chip.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', chip.dataset.answer);
        chip.classList.add('dragging');
      });
      chip.addEventListener('dragend', () => chip.classList.remove('dragging'));

      chip.addEventListener('touchstart', e => {
        e.preventDefault();
        const touch = e.touches[0];
        const ghost = chip.cloneNode(true);
        ghost.classList.add('touch-ghost');
        ghost.style.cssText = `position:fixed;z-index:9999;pointer-events:none;left:${touch.clientX - 40}px;top:${touch.clientY - 20}px;`;
        document.body.appendChild(ghost);
        chip._ghost = ghost;
      }, { passive: false });

      chip.addEventListener('touchmove', e => {
        e.preventDefault();
        const touch = e.touches[0];
        if (chip._ghost) {
          chip._ghost.style.left = (touch.clientX - 40) + 'px';
          chip._ghost.style.top  = (touch.clientY - 20) + 'px';
        }
        zones.forEach(z => { const tg = $('.dnd-zone-target', z); if (tg) tg.classList.remove('drag-over'); });
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const zt = el && el.closest('.dnd-zone-target');
        if (zt) zt.classList.add('drag-over');
      }, { passive: false });

      chip.addEventListener('touchend', e => {
        if (chip._ghost) { chip._ghost.remove(); chip._ghost = null; }
        const touch = e.changedTouches[0];
        const el    = document.elementFromPoint(touch.clientX, touch.clientY);
        const zt    = el && el.closest('.dnd-zone-target');
        if (zt && containerEl.contains(zt)) placeChip(zt, chip, chip.dataset.answer);
        zones.forEach(z => { const tg = $('.dnd-zone-target', z); if (tg) tg.classList.remove('drag-over'); });
      });
    });
    markReady(containerEl);
  }

  window.checkDnD = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) { console.error('[neopaper] checkDnD: no element #' + containerId); return; }
    $$('.dnd-zone', container).forEach(zone => {
      const target = $('.dnd-zone-target', zone);
      if (!target || !target.dataset.placed) return;
      target.classList.add(target.dataset.placed === zone.dataset.correct ? 'correct-placed' : 'incorrect-placed');
    });
  };

  window.resetDnD = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    $$('.dnd-zone-target', container).forEach(tg => {
      tg.textContent = tg.dataset.placeholder || t('dropHere');
      delete tg.dataset.placed;
      tg.classList.remove('correct-placed', 'incorrect-placed');
    });
    $$('.dnd-chip', container).forEach(c => c.classList.remove('placed', 'dragging'));
  };

  safeInit('drag-and-drop', () => $$('.dnd-container').forEach(el => safeInit('drag-and-drop #' + el.id, () => initDnD(el))));

  /* ── GROUP CHAT / RESEARCH DIALOGUE ENGINE ─────────────────── */
  function initChat(containerEl) {
    const messages   = $$('.chat-message', containerEl);
    const typingEl   = $('.chat-typing', containerEl);
    const typingAvEl = (containerEl.id && document.getElementById(containerEl.id + '-typing-avatar')) || (typingEl && $('.chat-avatar', typingEl));
    const progressEl = $('.chat-progress', containerEl);
    let index = 0;
    let timer = null;

    const actors = {};
    messages.forEach(msg => {
      const sender = msg.dataset.sender;
      const avatar = $('.chat-avatar', msg);
      if (avatar && !actors[sender]) actors[sender] = { initial: avatar.textContent.trim(), style: avatar.style.background };
    });

    function updateChatProgress() { if (progressEl) progressEl.textContent = index + ' / ' + messages.length; }

    function showNext() {
      if (index >= messages.length) return;
      const msg    = messages[index];
      const sender = msg.dataset.sender;
      index++;
      if (typingEl && actors[sender]) {
        if (typingAvEl) {
          typingAvEl.textContent      = actors[sender].initial;
          typingAvEl.style.background = actors[sender].style;
        }
        typingEl.style.display = 'flex';
      }
      setTimeout(() => {
        if (typingEl) typingEl.style.display = 'none';
        msg.style.display = 'flex';
        msg.style.animation = 'fadeSlideUp 0.3s var(--ease-out)';
        updateChatProgress();
      }, 600);
    }

    function showAll() {
      clearInterval(timer);
      timer = setInterval(() => {
        if (index >= messages.length) { clearInterval(timer); return; }
        showNext();
      }, 900);
    }

    function reset() {
      clearInterval(timer);
      index = 0;
      messages.forEach(m => { m.style.display = 'none'; m.style.animation = ''; });
      if (typingEl) typingEl.style.display = 'none';
      updateChatProgress();
    }

    const nextBtn  = $('.chat-next-btn',  containerEl);
    const allBtn   = $('.chat-all-btn',   containerEl);
    const resetBtn = $('.chat-reset-btn', containerEl);
    if (nextBtn)  nextBtn.addEventListener('click',  showNext);
    if (allBtn)   allBtn.addEventListener('click',   showAll);
    if (resetBtn) resetBtn.addEventListener('click', reset);
    updateChatProgress();
    markReady(containerEl);
  }

  safeInit('chat', () => $$('.chat-window').forEach(el => safeInit('chat #' + el.id, () => initChat(el))));

  /* ── FLOW ANIMATION ENGINE ─────────────────────────────────── */
  function initFlow(containerEl) {
    const stepsData  = JSON.parse(containerEl.dataset.steps || '[]');
    const labelEl    = $('.flow-step-label', containerEl);
    const progressEl = $('.flow-progress',   containerEl);
    const packet     = $('.flow-packet',     containerEl);
    let step = 0;

    function updateFlowProgress() {
      if (progressEl) progressEl.textContent = t('step', { n: step, total: stepsData.length });
    }

    function animatePacket(fromId, toId) {
      if (!packet) return;
      const fromEl = document.getElementById(fromId);
      const toEl   = document.getElementById(toId);
      if (!fromEl || !toEl) return;
      const fromR = fromEl.getBoundingClientRect();
      const toR   = toEl.getBoundingClientRect();
      const contR = containerEl.getBoundingClientRect();
      packet.style.setProperty('--packet-from-x', (fromR.left + fromR.width / 2  - contR.left) + 'px');
      packet.style.setProperty('--packet-from-y', (fromR.top  + fromR.height / 2 - contR.top) + 'px');
      packet.style.setProperty('--packet-to-x',   (toR.left   + toR.width / 2    - contR.left) + 'px');
      packet.style.setProperty('--packet-to-y',   (toR.top    + toR.height / 2   - contR.top) + 'px');
      packet.style.display   = 'block';
      packet.style.animation = 'none';
      void packet.offsetHeight;
      packet.style.animation = 'packetMove 0.8s var(--ease-in-out) forwards';
      setTimeout(() => { packet.style.display = 'none'; }, 850);
    }

    function next() {
      if (step >= stepsData.length) return;
      const s = stepsData[step];
      $$('.flow-actor', containerEl).forEach(a => a.classList.remove('active'));
      if (s.highlight) {
        const hEl = $('#' + s.highlight, containerEl) || document.getElementById('flow-' + s.highlight);
        if (hEl) hEl.classList.add('active');
      }
      if (s.packet && s.from && s.to) animatePacket('flow-' + s.from, 'flow-' + s.to);
      if (labelEl) { labelEl.textContent = s.label || ''; renderMath(labelEl); }
      step++;
      updateFlowProgress();
    }

    function reset() {
      step = 0;
      $$('.flow-actor', containerEl).forEach(a => a.classList.remove('active'));
      if (labelEl) labelEl.textContent = t('flowStart');
      if (packet)  packet.style.display = 'none';
      updateFlowProgress();
    }

    const nextBtn  = $('.flow-next-btn',  containerEl);
    const resetBtn = $('.flow-reset-btn', containerEl);
    if (nextBtn)  nextBtn.addEventListener('click',  next);
    if (resetBtn) resetBtn.addEventListener('click', reset);
    updateFlowProgress();
    markReady(containerEl);
  }

  safeInit('flow animation', () => $$('.flow-animation').forEach(el => safeInit('flow animation #' + el.id, () => initFlow(el))));

  /* ── ARCHITECTURE DIAGRAM ──────────────────────────────────── */
  safeInit('architecture diagram', () => {
    $$('.arch-component').forEach(comp => {
      comp.addEventListener('click', function () {
        const diagram = this.closest('.arch-diagram');
        $$('.arch-component', diagram).forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        const descEl = $('.arch-description', diagram);
        if (descEl) { descEl.textContent = this.dataset.desc || ''; renderMath(descEl); }
      });
    });
    $$('.arch-diagram').forEach(markReady);
  });

  /* ── BUG / ASSUMPTION CHALLENGE ────────────────────────────── */
  window.checkBugLine = function (el, isCorrect) {
    const challenge = el.closest('.bug-challenge') || el.closest('.assumption-challenge');
    const feedback  = challenge && ($('.bug-feedback', challenge) || $('.assumption-feedback', challenge));
    const base = feedback && feedback.classList.contains('bug-feedback') ? 'bug-feedback' : 'assumption-feedback';
    if (isCorrect) {
      el.classList.add('correct');
      setFeedback(feedback, base, 'success', t('found'), el.dataset.explanation);
      $$('.bug-line, .assumption-option', challenge).forEach(l => l.style.pointerEvents = 'none');
    } else {
      el.classList.add('incorrect');
      setFeedback(feedback, base, 'error', '', el.dataset.hint || t('notThisLine'));
      setTimeout(() => {
        el.classList.remove('incorrect');
        if (feedback) feedback.className = base;
      }, 1800);
    }
  };

  window.selectAssumption = function (btn) {
    const block = btn.closest('.assumption-challenge');
    $$('.assumption-option', block).forEach(o => o.classList.remove('selected'));
    btn.classList.add('selected');
  };

  window.checkAssumption = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) { console.error('[neopaper] checkAssumption: no element #' + containerId); return; }
    const selected = $('.assumption-option.selected', container);
    const feedback = $('.assumption-feedback', container);
    const correct  = container.dataset.correct;
    if (!selected) { setFeedback(feedback, 'assumption-feedback', 'warning', '', t('pickAnswer')); return; }
    $$('.assumption-option', container).forEach(o => o.disabled = true);
    if (selected.dataset.value === correct) {
      selected.classList.add('correct');
      setFeedback(feedback, 'assumption-feedback', 'success', t('correct'), container.dataset.explanationRight);
    } else {
      selected.classList.add('incorrect');
      const correctBtn = $(`.assumption-option[data-value="${correct}"]`, container);
      if (correctBtn) correctBtn.classList.add('correct');
      setFeedback(feedback, 'assumption-feedback', 'error', t('notQuite'), container.dataset.explanationWrong);
    }
  };

  safeInit('challenges', () => $$('.bug-challenge, .assumption-challenge').forEach(markReady));

  /* ── LAYER / ABLATION TOGGLE ───────────────────────────────── */
  window.showLayer = function (layerId, btn) {
    const demo = btn ? (btn.closest('.layer-demo') || btn.closest('.ablation-demo')) : null;
    if (!demo) return;
    $$('.layer, .ablation-layer', demo).forEach(l => l.style.display = 'none');
    $$('.layer-tab, .ablation-tab', demo).forEach(tb => tb.classList.remove('active'));
    // Scope the lookup to this demo so two ablation blocks may reuse layer ids.
    const layer = $$('.layer, .ablation-layer', demo).find(l => l.id === layerId) || document.getElementById(layerId);
    if (layer) layer.style.display = 'block';
    btn.classList.add('active');
  };

  safeInit('ablation toggle', () => $$('.layer-demo, .ablation-demo').forEach(markReady));

  /* ── DERIVATION / PROOF (whole, explained line by line) ───── */
  // Every line stays visible: a derivation or proof is read as a whole, with
  // each line's justification beside it. Upstream showed one step at a time
  // and hid the rest, which broke the argument into disconnected pages.
  // Hovering a line, or the optional Previous/Next controls, only
  // highlights it.
  function initMathDerivation(containerEl) {
    const steps      = $$('.math-step', containerEl);
    const progressEl = $('.math-progress', containerEl);
    let current = -1;

    steps.forEach(s => { s.style.display = ''; });

    function focusStep(idx) {
      current = idx;
      steps.forEach((s, i) => s.classList.toggle('current', i === idx));
      if (progressEl) progressEl.textContent = idx < 0 ? '' : t('step', { n: idx + 1, total: steps.length });
    }

    steps.forEach((s, i) => s.addEventListener('click', () => focusStep(current === i ? -1 : i)));
    const nextBtn  = $('.math-next-btn',  containerEl);
    const prevBtn  = $('.math-prev-btn',  containerEl);
    const resetBtn = $('.math-reset-btn', containerEl);
    if (nextBtn)  nextBtn.addEventListener('click',  () => focusStep(Math.min(current + 1, steps.length - 1)));
    if (prevBtn)  prevBtn.addEventListener('click',  () => focusStep(Math.max(current - 1, 0)));
    if (resetBtn) resetBtn.addEventListener('click', () => focusStep(-1));
    focusStep(-1);
    markReady(containerEl);
  }

  safeInit('math derivation', () => $$('.math-derivation').forEach(el => safeInit('math derivation #' + el.id, () => initMathDerivation(el))));

  /* ── PSEUDOCODE WALKTHROUGH ────────────────────────────────── */
  function findControls(containerEl, controlsClass) {
    // Controls may sit inside the walkthrough, inside a shared wrapper, or as
    // the walkthrough's next sibling (the layout upstream documented while
    // its engine only searched inside the walkthrough, leaving them dead).
    const inside = $('.' + controlsClass, containerEl);
    if (inside) return inside;
    const wrapper = containerEl.closest('.pseudocode-walkthrough');
    if (wrapper && $('.' + controlsClass, wrapper)) return $('.' + controlsClass, wrapper);
    const sib = containerEl.nextElementSibling;
    return sib && sib.classList.contains(controlsClass) ? sib : null;
  }

  function initPseudocodeWalkthrough(containerEl) {
    const lines     = $$('.pseudocode-line', containerEl);
    const explLines = $$('.pe', containerEl);
    const controls  = findControls(containerEl, 'pseudocode-controls');
    const scope     = controls || containerEl;
    const progressEl = $('.pseudocode-progress', scope);
    let current = -1;

    if (explLines.length && explLines.length !== lines.length) {
      console.error('[neopaper] pseudocode #' + containerEl.id + ': ' + lines.length + ' lines but ' + explLines.length + ' explanations');
    }

    function highlightLine(idx) {
      lines.forEach(l => l.classList.remove('highlighted'));
      explLines.forEach(l => l.classList.remove('active'));
      if (lines[idx]) lines[idx].classList.add('highlighted');
      if (explLines[idx]) explLines[idx].classList.add('active');
      if (progressEl) progressEl.textContent = (idx + 1) + ' / ' + lines.length;
    }

    const nextBtn  = $('.pseudocode-next-btn',  scope);
    const prevBtn  = $('.pseudocode-prev-btn',  scope);
    const resetBtn = $('.pseudocode-reset-btn', scope);
    if (!nextBtn) console.error('[neopaper] pseudocode #' + containerEl.id + ': no .pseudocode-next-btn found');
    if (nextBtn)  nextBtn.addEventListener('click',  () => { if (current < lines.length - 1) highlightLine(++current); });
    if (prevBtn)  prevBtn.addEventListener('click',  () => { if (current > 0) highlightLine(--current); });
    if (resetBtn) resetBtn.addEventListener('click', () => { current = -1; highlightLine(-1); });
    highlightLine(-1);
    markReady(containerEl);
  }

  safeInit('pseudocode', () => $$('.pseudocode-translation').forEach(el => safeInit('pseudocode #' + el.id, () => initPseudocodeWalkthrough(el))));

  /* ── RESULT COMPARISON ─────────────────────────────────────── */
  function initResultComparison(containerEl) {
    const metricBtns = $$('.result-metric', containerEl);
    const allBars    = $$('.result-bar', containerEl);
    const unit       = containerEl.dataset.unit != null ? containerEl.dataset.unit : '%';
    const max        = parseFloat(containerEl.dataset.max || '100');

    function showMetric(metricName) {
      metricBtns.forEach(b => b.classList.toggle('active', b.dataset.metric === metricName));
      allBars.forEach(bar => {
        const raw   = (metricName && bar.dataset[metricName]) || bar.dataset.value || '0';
        const value = parseFloat(raw);
        const fill  = $('.result-fill', bar);
        const valEl = $('.result-value', bar);
        if (fill)  fill.style.width = Math.max(0, Math.min(100, (value / max) * 100)) + '%';
        if (valEl) valEl.textContent = raw + unit;
      });
    }

    metricBtns.forEach(btn => btn.addEventListener('click', () => showMetric(btn.dataset.metric)));
    showMetric(metricBtns.length ? metricBtns[0].dataset.metric : null);
    markReady(containerEl);
  }

  safeInit('result comparison', () => $$('.result-comparison').forEach(el => safeInit('result comparison', () => initResultComparison(el))));

  /* ── RESEARCH LINEAGE TREE ─────────────────────────────────── */
  safeInit('lineage tree', () => {
    $$('.lineage-node').forEach(node => {
      node.addEventListener('click', function () {
        const tree = this.closest('.lineage-tree');
        const wasExpanded = this.classList.contains('expanded');
        $$('.lineage-node', tree).forEach(n => n.classList.remove('expanded'));
        if (!wasExpanded) this.classList.add('expanded');
        const descEl = $('.lineage-description', tree);
        if (descEl) { descEl.textContent = wasExpanded ? '' : (this.dataset.detail || ''); renderMath(descEl); }
      });
    });
    $$('.lineage-tree').forEach(markReady);
  });

  /* ── INTERACTIVE EXPLORER ──────────────────────────────────── */
  // A paper-specific simulation. The HTML is a container with
  // data-explorer="<name>"; the behaviour lives in explorers/<name>.js, which
  // pushes {name, spec} onto window.PaperCourseExplorers (see
  // references/explorer-template.js for the spec format). Script order does
  // not matter: specs pushed before this file runs are drained below, and
  // later pushes mount immediately.
  PC.refuse = function (message) {
    const e = new Error(message);
    e.pcRefusal = true;
    return e;
  };

  function deepFreeze(v) {
    if (v && typeof v === 'object' && !Object.isFrozen(v)) {
      Object.freeze(v);
      Object.keys(v).forEach(k => deepFreeze(v[k]));
    }
    return v;
  }

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function mountExplorer(root, spec) {
    const name = root.dataset.explorer;
    if (root.dataset.pcReady) return;
    if (typeof spec.initial !== 'function' || typeof spec.render !== 'function' || !Array.isArray(spec.actions)) {
      throw new Error('explorer "' + name + '" spec needs initial(), render() and actions[]');
    }

    const params = {};
    (spec.params || []).forEach(p => { params[p.id] = p.value; });

    const paramsEl  = el('div', 'explorer-params');
    const actionsEl = el('div', 'explorer-actions');
    const stageEl   = el('div', 'explorer-stage');
    const msgEl     = el('div', 'explorer-message');
    const checksEl  = el('div', 'explorer-checks');
    const logWrap   = el('div', 'explorer-log-wrap');
    const logEl     = el('ol', 'explorer-log');
    const toolbar   = el('div', 'explorer-toolbar');
    const backBtn   = el('button', 'btn explorer-back-btn', t('explorerBack'));
    const resetBtn  = el('button', 'btn explorer-reset-btn', t('explorerReset'));
    backBtn.type = resetBtn.type = 'button';
    toolbar.append(backBtn, resetBtn);
    logWrap.append(el('div', 'explorer-section-label', t('explorerHistory')), logEl);

    const body = el('div', 'explorer-body');
    const main = el('div', 'explorer-main');
    const side = el('div', 'explorer-side');
    main.append(paramsEl, actionsEl, stageEl, msgEl);
    side.append(checksEl, logWrap, toolbar);
    body.append(main, side);
    const note = $('.explorer-note', root);
    if (note) root.insertBefore(body, note); else root.appendChild(body);

    let history = []; // [{state, label}]

    function current() { return history[history.length - 1].state; }

    function showMessage(text, kind) {
      msgEl.textContent = text || '';
      msgEl.className = 'explorer-message' + (text ? ' show ' + (kind || 'info') : '');
      renderMath(msgEl);
    }

    function draw() {
      const state = current();
      stageEl.innerHTML = spec.render(state, params);

      actionsEl.querySelectorAll('button').forEach(b => {
        const action = spec.actions.find(a => a.id === b.dataset.action);
        b.disabled = !!(action && action.enabled && !action.enabled(state, params));
      });

      checksEl.textContent = '';
      if (spec.checks && spec.checks.length) {
        checksEl.appendChild(el('div', 'explorer-section-label', t('explorerChecks')));
        spec.checks.forEach(c => {
          let res = c.test(state, params);
          if (typeof res === 'boolean') res = { ok: res };
          const row = el('div', 'explorer-check ' + (res.ok ? 'ok' : 'fail'));
          const label = el('span', 'explorer-check-label');
          label.innerHTML = c.label;
          const pill = el('span', 'explorer-check-pill', res.ok ? t('explorerHolds') : t('explorerFails'));
          row.append(label, pill);
          if (res.detail) row.appendChild(el('span', 'explorer-check-detail', res.detail));
          checksEl.appendChild(row);
        });
      }

      logEl.textContent = '';
      if (history.length === 1) {
        logEl.appendChild(el('li', 'explorer-log-empty', t('explorerNoSteps')));
      } else {
        history.slice(1).forEach(h => {
          const li = el('li');
          li.innerHTML = h.label;
          logEl.appendChild(li);
        });
      }
      backBtn.disabled = history.length <= 1;
      markClickable(stageEl);
      renderMath(stageEl);
      renderMath(checksEl);
      renderMath(logEl);
    }

    function start() {
      history = [{ state: deepFreeze(spec.initial(params)), label: t('explorerStart') }];
      showMessage('');
      draw();
    }

    function run(action, arg) {
      const before = current();
      if (action.enabled && !action.enabled(before, params)) return;
      let after;
      try {
        after = action.apply(before, params, arg);
      } catch (e) {
        if (e && e.pcRefusal) { showMessage(e.message, 'refused'); return; }
        console.error('[neopaper] explorer "' + name + '" action "' + action.id + '" threw:', e);
        showMessage(String(e && e.message || e), 'error');
        return;
      }
      if (after === undefined) {
        console.error('[neopaper] explorer "' + name + '" action "' + action.id + '" returned undefined; apply() must return the new state');
        return;
      }
      const label = spec.describe ? spec.describe(action, before, after, params, arg) : action.label;
      history.push({ state: deepFreeze(after), label: label });
      showMessage(action.note ? action.note(before, after, params, arg) : '', 'info');
      draw();
    }

    (spec.params || []).forEach(p => {
      const wrap = el('label', 'explorer-param');
      const lab  = el('span', 'explorer-param-label');
      lab.innerHTML = p.label;
      const out  = el('span', 'explorer-param-value');
      let input;
      if (p.type === 'select') {
        input = el('select');
        (p.options || []).forEach(o => {
          const opt = el('option', null, o.label);
          opt.value = o.value;
          if (String(o.value) === String(p.value)) opt.selected = true;
          input.appendChild(opt);
        });
      } else {
        input = el('input');
        input.type = 'range';
        input.min = p.min; input.max = p.max; input.step = p.step || 1; input.value = p.value;
      }
      input.dataset.param = p.id;
      const sync = () => {
        const raw = input.value;
        params[p.id] = p.type === 'select' ? (p.options.find(o => String(o.value) === raw) || {}).value : parseFloat(raw);
        out.textContent = p.type === 'select' ? '' : String(params[p.id]);
      };
      input.addEventListener('input', () => { sync(); start(); });
      sync();
      wrap.append(lab, input, out);
      paramsEl.appendChild(wrap);
    });
    renderMath(paramsEl);

    spec.actions.forEach(action => {
      if (action.hidden) return;
      const b = el('button', 'btn explorer-action');
      b.type = 'button';
      b.dataset.action = action.id;
      b.innerHTML = action.label;
      if (action.title) b.title = action.title;
      b.addEventListener('click', () => run(action));
      actionsEl.appendChild(b);
    });
    renderMath(actionsEl);

    // Elements rendered into the stage may carry data-action / data-arg.
    stageEl.addEventListener('click', e => {
      const target = e.target.closest('[data-action]');
      if (!target || !stageEl.contains(target)) return;
      const action = spec.actions.find(a => a.id === target.dataset.action);
      if (!action) { console.error('[neopaper] explorer "' + name + '": unknown data-action "' + target.dataset.action + '"'); return; }
      run(action, target.dataset.arg);
    });

    backBtn.addEventListener('click', () => { if (history.length > 1) { history.pop(); showMessage(''); draw(); } });
    resetBtn.addEventListener('click', start);

    start();
    markReady(root);
  }

  function registerExplorer(entry) {
    if (!entry || !entry.name || !entry.spec) {
      console.error('[neopaper] PaperCourseExplorers.push() needs {name, spec}');
      return;
    }
    const roots = $$('[data-explorer="' + entry.name + '"]');
    if (!roots.length) console.error('[neopaper] explorer "' + entry.name + '" has a spec but no data-explorer element');
    roots.forEach(root => safeInit('explorer "' + entry.name + '"', () => mountExplorer(root, entry.spec)));
  }

  safeInit('explorers', () => {
    const queued = Array.isArray(window.PaperCourseExplorers) ? window.PaperCourseExplorers : [];
    window.PaperCourseExplorers = { push: function () { Array.from(arguments).forEach(registerExplorer); } };
    queued.forEach(registerExplorer);
    window.addEventListener('load', () => {
      $$('[data-explorer]').forEach(root => {
        if (!root.dataset.pcReady) console.error('[neopaper] explorer "' + root.dataset.explorer + '" was never mounted: is explorers/' + root.dataset.explorer + '.js missing or broken?');
      });
    });
  });

  /* ── READING POSITION ──────────────────────────────────────── */
  // A reload (or a rebuild after review feedback) returns the reader to the
  // screen they were reading. The position is stored as "screen N plus an
  // offset into it", not raw pixels, so it survives layout changes.
  //
  // Where it is stored:
  //  - Opened directly: this browser's localStorage.
  //  - Inside Lavish Editor: the page runs in a sandboxed frame that has no
  //    storage at all, so the position goes into a hidden form control inside
  //    a [data-lavish-question] wrapper. Lavish keeps such control values in
  //    its own per-tab storage and writes them back into the page after every
  //    load, including a full tab reload; the course then scrolls there.
  //    Lavish only uses these values to restore the page; it sends nothing.
  safeInit('reading position', () => {
    const key = 'neopaper:position:' + location.pathname + ':' + document.title;
    const anchors = () => $$('.screen, .module, .course-cover');
    let storage = null;
    try { storage = window.localStorage; storage.getItem(key); } catch (e) { storage = null; }

    let field = null;
    if (!storage) {
      const wrap = document.createElement('div');
      wrap.hidden = true;
      wrap.setAttribute('data-lavish-question', 'neopaper reading position');
      field = document.createElement('input');
      field.type = 'hidden';
      field.name = 'neopaper-position';
      wrap.appendChild(field);
      document.body.appendChild(wrap);
    }
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    function read() {
      try { return JSON.parse((storage ? storage.getItem(key) : field.value) || 'null'); } catch (e) { return null; }
    }
    function write(value) {
      const text = JSON.stringify(value);
      if (storage) { try { storage.setItem(key, text); } catch (e) { /* storage full or blocked */ } return; }
      if (field.value === text) return;
      field.value = text;
      field.dispatchEvent(new Event('input', { bubbles: true })); // Lavish saves on input
    }

    // Layout position, ignoring transforms: sections not yet revealed are
    // still shifted by their fade-in transform, which getBoundingClientRect
    // would count and turn into a drift on every reload.
    function absTop(el) { let t = 0; for (let n = el; n; n = n.offsetParent) t += n.offsetTop; return t; }

    let restored = false;
    function save() {
      if (!restored) return; // never overwrite the saved place before going back to it
      const y = window.scrollY;
      let idx = -1, offset = 0;
      anchors().forEach((el, i) => {
        const top = absTop(el);
        if (top <= y + 1) { idx = i; offset = y - top; }
      });
      write({ idx: idx, offset: Math.round(offset), y: Math.round(y) });
    }
    function goTo(saved) {
      const el = anchors()[saved.idx];
      const y = el ? absTop(el) + saved.offset : saved.y;
      window.scrollTo({ top: Math.max(0, y), behavior: 'instant' });
    }
    function restore() {
      if (storage) {
        const saved = read();
        if (saved) goTo(saved);
        restored = true;
        return;
      }
      // Lavish writes the saved value back shortly after the frame loads.
      let tries = 0;
      const timer = setInterval(() => {
        const saved = read();
        if (saved || ++tries > 30) {
          clearInterval(timer);
          if (saved) goTo(saved);
          restored = true;
        }
      }, 100);
    }

    let timer = null;
    window.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(save, 250); }, { passive: true });
    window.addEventListener('pagehide', save);
    // Restore after fonts, KaTeX and images have settled the layout.
    const settled = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve())
      .then(() => requestAnimationFrame(restore));
    if (document.readyState === 'complete') settled();
    else window.addEventListener('load', settled);
  });

  safeInit('lavish pass-through', () => markClickable(document));

  PC.ready = true;
})();
