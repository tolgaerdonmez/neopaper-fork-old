# Interactive Elements Reference

Implementation patterns for every interactive element type used in paper-to-course tutorials.

> **Architecture note:** All CSS and JavaScript live in `references/styles.css` and `references/main.js`, copied verbatim into every course directory. Write only the HTML patterns below — no inline `<style>` or `<script>`.

## Table of Contents
0. [Cover Page / Hero Section](#cover-page--hero-section)
1. [Math Derivation Walkthrough](#math-derivation-walkthrough)
2. [Pseudocode Walkthrough](#pseudocode-walkthrough)
3. [Result Comparison Interactive](#result-comparison-interactive)
4. [Research Lineage Tree](#research-lineage-tree)
5. [Research Dialogue (Group Chat)](#research-dialogue-group-chat)
6. [SVG Diagrams](#svg-diagrams)
7. [Multiple-Choice Quizzes](#multiple-choice-quizzes)
8. [Drag-and-Drop Matching](#drag-and-drop-matching)
9. [Spot the Assumption](#spot-the-assumption)
10. [Ablation Toggle](#ablation-toggle)
11. [Callout Boxes](#callout-boxes)
12. [Contribution / Concept Cards](#contribution--concept-cards)
13. [Paper Citation Cards](#paper-citation-cards)
14. [Flow Diagrams](#flow-diagrams)
15. [Glossary Tooltips](#glossary-tooltips)
16. [Numbered Step Cards](#numbered-step-cards)
17. [Icon-Label Rows](#icon-label-rows)

---

## Cover Page / Hero Section

The course cover is a full-viewport landing page that appears before all modules. It is NOT a `.module` — it has no nav-dot and does not participate in scroll-snap.

**Wiring:** The "Start Learning" button scrolls to Module 0. Handled by `main.js` cover CTA listener.

**HTML:**
```html
<section class="course-cover">
  <div class="course-cover-inner">
    <span class="course-cover-badge">Interactive Tutorial</span>
    <h1 class="course-cover-title">Nonsense Helps: How Prompt-Space Perturbation Broadens Reasoning Exploration</h1>
    <p class="course-cover-subtitle">How adding random noise to prompts can expand reasoning exploration in LLM training</p>
    <p class="course-cover-authors">Yuntao Bai et al. · arXiv 2026</p>
    <div class="course-cover-meta">
      <span class="course-cover-meta-item">&#128218; 7 Modules</span>
      <span class="course-cover-meta-item">&#9201; ~45 min</span>
      <span class="course-cover-meta-item">&#127891; Intermediate</span>
    </div>
    <div class="course-cover-abstract">
      <span class="course-cover-abstract-label">Abstract</span>
      <p>This paper proposes LoPE, a method that promotes exploration in GRPO training by adding Lorem Ipsum random noise to the prompt space, solving the zero-advantage problem...</p>
    </div>
    <a href="#module-0" class="course-cover-cta">Start Learning →</a>
  </div>
</section>
```

**Rules:**
- The cover is NOT a `.module` section — no `scroll-snap-align`, no module number
- The "Start Learning" button scrolls to Module 0 (the prerequisites module)
- Paper title should be in the course's output language, with the English original in parentheses if translated
- Abstract is abbreviated to 2-3 sentences, not the full paper abstract
- Metadata badges: module count, estimated time (rough: 5-7 min per module), difficulty level
- Difficulty levels: Beginner (no prerequisites), Intermediate (some domain knowledge), Advanced (significant math/domain background)

---

## Math Derivation Walkthrough

The most important teaching element. Shows a mathematical equation and lets the learner click through each derivation step.

**Wiring:** `main.js` auto-initializes every `.math-derivation`. Steps are `.math-step` elements. Controls: `.math-next-btn`, `.math-prev-btn`, `.math-reset-btn`. Progress: `.math-progress`.

**HTML:**
```html
<div class="math-derivation animate-in" id="math-deriv-1">
  <div class="math-step" data-step="0">
    <div class="math-equation">
      $$L_{GRPO} = -\mathbb{E}_{q \sim P(Q)} \left[ \frac{1}{G} \sum_{i=1}^{G} \min\left( \frac{\pi_\theta(o_i|q)}{\pi_{ref}(o_i|q)} A_i, \text{clip}(\cdot) A_i \right) \right]$$
    </div>
    <div class="math-explanation">
      <p>The GRPO loss function measures how far the model's answers are from the reference policy. The advantage function $A_i$ tells us how good each answer is relative to the average.</p>
    </div>
  </div>

  <div class="math-step" data-step="1" style="display:none">
    <div class="math-equation">
      $$A_i = \frac{r_i - \text{mean}(\{r_1, ..., r_G\})}{\text{std}(\{r_1, ..., r_G\})}$$
    </div>
    <div class="math-explanation">
      <p>The advantage is computed by within-group normalization: subtract the mean from each answer's reward, then divide by the standard deviation. This tells us how much better or worse each answer is than the others in the same group.</p>
    </div>
  </div>

  <!-- more steps -->

  <div class="math-controls">
    <button class="btn math-prev-btn">Previous</button>
    <button class="btn math-next-btn">Next</button>
    <button class="btn math-reset-btn">Restart</button>
    <span class="math-progress"></span>
  </div>
</div>
```

**Rules:**
- Each step should explain ONE transformation or insight
- The explanation should be in plain language, not just "taking the derivative"
- KaTeX auto-renders `$$...$$` blocks; `main.js` re-renders when a new step becomes visible
- Use `$...$` for inline math within explanations

---

## Pseudocode Walkthrough

Like a code translation block, but for algorithm pseudocode. Left panel: the algorithm. Right panel: line-by-line explanation.

**Wiring:** `main.js` auto-initializes every `.pseudocode-translation`. Controls: `.pseudocode-next-btn`, `.pseudocode-prev-btn`, `.pseudocode-reset-btn`. Progress: `.pseudocode-progress`.

**HTML:**
```html
<div class="pseudocode-translation animate-in" id="pseudo-lope">
  <div class="pseudocode-block">
    <span class="translation-label">ALGORITHM</span>
    <span class="pseudocode-line">INPUT: prompt q, model π, perturbation text P</span>
    <span class="pseudocode-line">FOR i = 1 TO G DO</span>
    <span class="pseudocode-line">  q' = CONCAT(random_prefix(P), q)</span>
    <span class="pseudocode-line">  o_i = SAMPLE(π, q')</span>
    <span class="pseudocode-line">  r_i = REWARD(o_i, q)</span>
    <span class="pseudocode-line">END FOR</span>
    <span class="pseudocode-line">A = NORMALIZE({r_1, ..., r_G})</span>
    <span class="pseudocode-line">UPDATE π USING A</span>
  </div>
  <div class="pseudocode-explanation">
    <span class="translation-label">EXPLANATION</span>
    <div class="pseudocode-explanation-lines">
      <p class="pe">Input: the original question, the current model, and the text used for perturbation (e.g. Lorem Ipsum)</p>
      <p class="pe">Repeat G times for each sampling group</p>
      <p class="pe">Randomly cut a segment from the perturbation text and prepend it to the question</p>
      <p class="pe">Use the model to generate an answer to the noised question</p>
      <p class="pe">Use the reward function to evaluate answer quality (based on the original question, not the perturbed one)</p>
      <p class="pe">End the loop</p>
      <p class="pe">Normalize all rewards to get the advantage values</p>
      <p class="pe">Update the model parameters using the advantage values</p>
    </div>
  </div>
</div>

<div class="pseudocode-controls">
  <button class="btn pseudocode-prev-btn">Previous line</button>
  <button class="btn pseudocode-next-btn">Next line</button>
  <button class="btn pseudocode-reset-btn">Restart</button>
  <span class="pseudocode-progress"></span>
</div>
```

**Rules:**
- Pseudocode should be language-agnostic (INPUT, FOR, IF...THEN, not Python/C++)
- Each line maps 1:1 to an explanation line
- The explanation should explain WHY, not just WHAT

---

## Result Comparison Interactive

Interactive bar charts for comparing experimental results across methods or configurations.

**Wiring:** `main.js` auto-initializes every `.result-comparison`. Metric toggle buttons: `.result-metric` with `data-metric` attribute. Bars: `.result-bar` with `data-*` attributes per metric.

**HTML:**
```html
<div class="result-comparison animate-in">
  <div class="result-header">
    <h4>Math Reasoning Benchmark Results</h4>
    <div class="result-metric-toggle">
      <button class="result-metric active" data-metric="accuracy">Accuracy</button>
      <button class="result-metric" data-metric="pass1">Pass@1</button>
    </div>
  </div>
  <div class="result-bars">
    <div class="result-bar" data-accuracy="78.3" data-pass1="65.2">
      <span class="result-label">LoPE (this paper)</span>
      <div class="result-bar-track"><div class="result-fill ours" style="width:0%"></div></div>
      <span class="result-value"></span>
    </div>
    <div class="result-bar" data-accuracy="72.1" data-pass1="58.7">
      <span class="result-label">GRPO baseline</span>
      <div class="result-bar-track"><div class="result-fill baseline" style="width:0%"></div></div>
      <span class="result-value"></span>
    </div>
    <div class="result-bar" data-accuracy="68.5" data-pass1="54.3">
      <span class="result-label">PPO baseline</span>
      <div class="result-bar-track"><div class="result-fill baseline" style="width:0%"></div></div>
      <span class="result-value"></span>
    </div>
  </div>
</div>
```

**Rules:**
- The "ours" bar uses `.result-fill.ours` (accent color); baselines use `.result-fill.baseline` (gray)
- Data values are percentages (shown as width%)
- `main.js` animates bar widths and updates values on metric toggle

---

## Research Lineage Tree

Visual tree showing how this paper relates to prior work.

**HTML (CSS-based tree):**
```html
<div class="lineage-tree animate-in">
  <div class="lineage-node lineage-root" data-detail="LoPE: expands the reasoning exploration space by adding random noise to the prompt">
    <span class="lineage-label">LoPE</span>
    <span class="lineage-detail">This paper (2026)</span>
  </div>
  <div class="lineage-branch">
    <div class="lineage-edge-label">improves on</div>
    <div class="lineage-node" data-detail="Group Relative Policy Optimization: within-group relative advantage estimation">
      <span class="lineage-label">GRPO</span>
      <span class="lineage-detail">Shao et al., 2024</span>
    </div>
    <div class="lineage-branch">
      <div class="lineage-edge-label">builds on</div>
      <div class="lineage-node" data-detail="Proximal Policy Optimization: a proximal policy optimization method">
        <span class="lineage-label">PPO</span>
        <span class="lineage-detail">Schulman et al., 2017</span>
      </div>
    </div>
  </div>
  <div class="lineage-branch">
    <div class="lineage-edge-label">related to</div>
    <div class="lineage-node" data-detail="Reinforcement Learning from Human Feedback">
      <span class="lineage-label">RLHF</span>
      <span class="lineage-detail">Ouyang et al., 2022</span>
    </div>
  </div>
</div>
```

**SVG-based tree (for complex lineages):**
```html
<div class="svg-diagram">
  <svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg">
    <rect class="node-rect accent" x="300" y="20" width="200" height="60" rx="12"/>
    <text x="400" y="50" text-anchor="middle" font-weight="700" font-size="14">LoPE</text>
    <text x="400" y="68" text-anchor="middle" font-size="11" fill="#9E9790">This paper, 2026</text>

    <line class="edge-line accent" x1="400" y1="80" x2="200" y2="150"/>
    <text x="280" y="115" font-size="10" fill="#9E9790" font-style="italic">improves on</text>
    <rect class="node-rect" x="100" y="150" width="200" height="60" rx="12"/>
    <text x="200" y="180" text-anchor="middle" font-weight="700" font-size="14">GRPO</text>

    <line class="edge-line" x1="200" y1="210" x2="200" y2="280"/>
    <rect class="node-rect" x="100" y="280" width="200" height="60" rx="12"/>
    <text x="200" y="310" text-anchor="middle" font-weight="700" font-size="14">PPO</text>
  </svg>
</div>
```

---

## Research Dialogue (Group Chat)

iMessage-style chat showing researchers or methods "discussing" a concept. Same engine as codebase-to-course's group chat.

**Wiring:** `main.js` auto-initializes every `.chat-window`. Controls: `.chat-next-btn`, `.chat-all-btn`, `.chat-reset-btn`. Progress: `.chat-progress`.

**HTML:**
```html
<div class="chat-window animate-in" id="chat-module2">
  <div class="chat-messages">
    <div class="chat-message" data-msg="0" data-sender="researcher-a" style="display:none">
      <div class="chat-avatar" style="background: var(--color-actor-1)">A</div>
      <div class="chat-bubble">
        <span class="chat-sender" style="color: var(--color-actor-1)">Researcher A</span>
        <p>Isn't this just data augmentation? What is the fundamental difference between prepending random text to the input and back-translation?</p>
      </div>
    </div>
    <div class="chat-message" data-msg="1" data-sender="researcher-b" style="display:none">
      <div class="chat-avatar" style="background: var(--color-actor-2)">B</div>
      <div class="chat-bubble">
        <span class="chat-sender" style="color: var(--color-actor-2)">Researcher B</span>
        <p>Not quite. Data augmentation changes the distribution of the training data, whereas LoPE changes the prompt space at inference time. The model itself doesn't change; what changes is how it explores.</p>
      </div>
    </div>
  </div>
  <div class="chat-typing" style="display:none">
    <div class="chat-avatar">?</div>
    <div class="chat-typing-dots">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  </div>
  <div class="chat-controls">
    <button class="btn chat-next-btn">Next message</button>
    <button class="btn chat-all-btn">Play all</button>
    <button class="btn chat-reset-btn">Replay</button>
    <span class="chat-progress"></span>
  </div>
</div>
```

---

## SVG Diagrams

For concept maps, experimental frameworks, algorithm flows, and comparison matrices.

**HTML:**
```html
<div class="svg-diagram animate-in">
  <svg viewBox="0 0 800 300" xmlns="http://www.w3.org/2000/svg">
    <!-- Example: experimental framework -->
    <rect class="node-rect accent" x="50" y="120" width="160" height="60" rx="12"/>
    <text x="130" y="150" text-anchor="middle" font-weight="700" font-size="13">Original prompt q</text>

    <line class="edge-line" x1="210" y1="150" x2="290" y2="150"/>
    <polygon class="edge-arrow" points="285,145 295,150 285,155"/>

    <rect class="node-rect" x="290" y="120" width="160" height="60" rx="12"/>
    <text x="370" y="145" text-anchor="middle" font-weight="600" font-size="13">Add noise</text>
    <text x="370" y="163" text-anchor="middle" font-size="11" fill="#9E9790">Lorem Ipsum</text>

    <line class="edge-line" x1="450" y1="150" x2="530" y2="150"/>
    <polygon class="edge-arrow" points="525,145 535,150 525,155"/>

    <rect class="node-rect accent" x="530" y="120" width="160" height="60" rx="12"/>
    <text x="610" y="145" text-anchor="middle" font-weight="700" font-size="13">Model sampling</text>
    <text x="610" y="163" text-anchor="middle" font-size="11" fill="#9E9790">π(o|q')</text>
  </svg>
</div>
```

**Rules:**
- Use `viewBox` for responsiveness, `width="100%"` on the SVG
- Use CSS variable references in inline `style` attributes for colors
- Keep node text short (1-2 lines)
- Use `<foreignObject>` for longer text blocks if needed

---

## Multiple-Choice Quizzes

Same pattern as codebase-to-course, adapted for paper content.

**Wiring:** `main.js` exposes `window.selectOption(btn)`, `window.checkQuiz(containerId)`, `window.resetQuiz(containerId)`.

**HTML:**
```html
<div class="quiz-container animate-in" id="quiz-module3">
  <div class="quiz-question-block"
       data-correct="option-b"
       data-explanation-right="Correct! When all samples fail, the advantage is zero and the model cannot learn."
       data-explanation-wrong="Not quite. Think about what happens when all answers in the group get the same reward...">
    <h3 class="quiz-question">What happens in GRPO if all answers in a sampling group receive the same reward?</h3>
    <div class="quiz-options">
      <button class="quiz-option" data-value="option-a" onclick="selectOption(this)">
        <div class="quiz-option-radio"></div>
        <span>The model randomly picks one answer as the positive example</span>
      </button>
      <button class="quiz-option" data-value="option-b" onclick="selectOption(this)">
        <div class="quiz-option-radio"></div>
        <span>The advantage is zero, so the model cannot learn from this group of samples</span>
      </button>
      <button class="quiz-option" data-value="option-c" onclick="selectOption(this)">
        <div class="quiz-option-radio"></div>
        <span>The model lowers the probability of all answers</span>
      </button>
    </div>
    <div class="quiz-feedback"></div>
  </div>

  <button class="quiz-check-btn" onclick="checkQuiz('quiz-module3')">Check answer</button>
  <button class="quiz-reset-btn" onclick="resetQuiz('quiz-module3')">Try again</button>
</div>
```

---

## Drag-and-Drop Matching

Same pattern as codebase-to-course, adapted for matching concepts to definitions, methods to papers, etc.

**HTML:**
```html
<div class="dnd-container animate-in" id="dnd-module2">
  <div class="dnd-chips">
    <div class="dnd-chip" draggable="true" data-answer="grpo">GRPO</div>
    <div class="dnd-chip" draggable="true" data-answer="ppo">PPO</div>
    <div class="dnd-chip" draggable="true" data-answer="reinforce">REINFORCE</div>
  </div>
  <div class="dnd-zones">
    <div class="dnd-zone" data-correct="grpo">
      <p class="dnd-zone-label">Uses within-group relative advantage estimation; no value network needed</p>
      <div class="dnd-zone-target">Drop here</div>
    </div>
    <div class="dnd-zone" data-correct="ppo">
      <p class="dnd-zone-label">Uses a clipped objective function to limit the size of policy updates</p>
      <div class="dnd-zone-target">Drop here</div>
    </div>
    <div class="dnd-zone" data-correct="reinforce">
      <p class="dnd-zone-label">The most basic policy gradient method; uses Monte Carlo sampling</p>
      <div class="dnd-zone-target">Drop here</div>
    </div>
  </div>
  <div style="margin-top:var(--space-4)">
    <button class="btn" onclick="checkDnD('dnd-module2')">Check matches</button>
    <button class="btn" onclick="resetDnD('dnd-module2')">Reset</button>
  </div>
</div>
```

---

## Spot the Assumption

Shows a claim or experimental setup and asks the learner to identify the hidden assumption.

**Wiring:** Uses quiz-style selection via `window.selectAssumption(btn)` and `window.checkAssumption(containerId)`.

**HTML:**
```html
<div class="assumption-challenge animate-in" id="assumption-1"
     data-correct="option-b"
     data-explanation-right="Correct! The paper only tested on math reasoning tasks, assuming the method also works on other types of reasoning (such as code or commonsense reasoning), but this has not been verified."
     data-explanation-wrong="Not quite. Think about the scope of the experiments and how far the conclusion generalizes...">
  <h3>Identify the hidden assumption in the following conclusion:</h3>
  <div class="assumption-claim">
    "By adding perturbations in the prompt space, LoPE effectively improves the reasoning exploration ability of large language models."
  </div>
  <div class="assumption-options">
    <button class="assumption-option" data-value="option-a" onclick="selectAssumption(this)">
      <div class="quiz-option-radio"></div>
      <span>Assumes Lorem Ipsum is the optimal perturbation text</span>
    </button>
    <button class="assumption-option" data-value="option-b" onclick="selectAssumption(this)">
      <div class="quiz-option-radio"></div>
      <span>Assumes the improvement on math reasoning generalizes to other reasoning tasks</span>
    </button>
    <button class="assumption-option" data-value="option-c" onclick="selectAssumption(this)">
      <div class="quiz-option-radio"></div>
      <span>Assumes larger models always gain larger improvements</span>
    </button>
  </div>
  <div class="assumption-feedback"></div>
  <button class="quiz-check-btn" onclick="checkAssumption('assumption-1')">Check answer</button>
</div>
```

---

## Ablation Toggle

Shows experimental results with different components removed. Each tab shows what happens when you remove one part.

**Wiring:** `window.showLayer(layerId, btn)` — same engine as layer toggle.

**HTML:**
```html
<div class="ablation-demo animate-in">
  <div class="ablation-tabs">
    <button class="ablation-tab active" onclick="showLayer('full', this)">Full LoPE</button>
    <button class="ablation-tab" onclick="showLayer('no-prefix', this)">Remove random prefix</button>
    <button class="ablation-tab" onclick="showLayer('no-norm', this)">Remove normalization</button>
  </div>
  <div class="ablation-viewport">
    <div class="ablation-layer" id="full" style="display:block">
      <div class="ablation-metric">78.3%</div>
      <div class="ablation-delta positive">+6.2% vs baseline</div>
      <p class="ablation-description">Full method: random prefix + within-group normalized advantage</p>
    </div>
    <div class="ablation-layer" id="no-prefix" style="display:none">
      <div class="ablation-metric">72.1%</div>
      <div class="ablation-delta neutral">On par with baseline</div>
      <p class="ablation-description">Without the random prefix, the method degenerates into standard GRPO</p>
    </div>
    <div class="ablation-layer" id="no-norm" style="display:none">
      <div class="ablation-metric">74.8%</div>
      <div class="ablation-delta positive">+2.7% vs baseline</div>
      <p class="ablation-description">Still an improvement without normalization, but a weaker one</p>
    </div>
  </div>
</div>
```

---

## Callout Boxes

Max 2 per module.

```html
<div class="callout callout-accent animate-in">
  <div class="callout-icon">&#128161;</div>
  <div class="callout-content">
    <strong class="callout-title">Key Insight</strong>
    <p>You don't need to change the model or the reward function -- only the input. This is the most counterintuitive part of LoPE.</p>
  </div>
</div>
```

**Variants:**
- `callout-accent`: key insights
- `callout-info`: good to know
- `callout-warning`: common misconceptions

---

## Contribution / Concept Cards

```html
<div class="contribution-cards stagger-children animate-in">
  <div class="contribution-card">
    <div class="contribution-num">1</div>
    <div class="contribution-text">
      <strong>Prompt-space perturbation</strong>
      <p>Prepend random text to the original question to change the model's input distribution</p>
    </div>
  </div>
  <div class="contribution-card">
    <div class="contribution-num">2</div>
    <div class="contribution-text">
      <strong>Solving the zero-advantage problem</strong>
      <p>Perturbation diversifies the samples, preventing all answers from receiving the same reward</p>
    </div>
  </div>
</div>
```

---

## Paper Citation Cards

```html
<div class="paper-citation animate-in">
  <div class="paper-citation-title">DeepSeekMath: Pushing the Limits of Mathematical Reasoning</div>
  <div class="paper-citation-authors">Shao et al., 2024</div>
  <div class="paper-citation-summary">Proposed GRPO, which replaces the value network with within-group relative advantage estimation and simplifies the RL training pipeline. This paper builds on it to further explore prompt-space perturbation.</div>
</div>
```

---

## Flow Diagrams

```html
<div class="flow-steps animate-in">
  <div class="flow-step">
    <div class="flow-step-num">1</div>
    <p>Original prompt</p>
  </div>
  <div class="flow-arrow">&rarr;</div>
  <div class="flow-step">
    <div class="flow-step-num">2</div>
    <p>Add noise prefix</p>
  </div>
  <div class="flow-arrow">&rarr;</div>
  <div class="flow-step">
    <div class="flow-step-num">3</div>
    <p>Model samples G answers</p>
  </div>
  <div class="flow-arrow">&rarr;</div>
  <div class="flow-step">
    <div class="flow-step-num">4</div>
    <p>Reward evaluation + GRPO update</p>
  </div>
</div>
```

---

## Glossary Tooltips

Mark up EVERY technical term on first use per module.

```html
<p>LoPE uses
  <span class="term" data-definition="Group Relative Policy Optimization (GRPO): a reinforcement learning method that updates the model by comparing the relative quality of multiple answers within the same group, without needing to train a separate value network.">GRPO</span>
  as its base training framework and introduces perturbations in the
  <span class="term" data-definition="Prompt Space: the space formed by the input texts the model receives. Changing the prompt means changing the input the model sees.">prompt space</span>.
</p>
```

**Rules:**
- Every technical term on first use per module
- Keep definitions to 1-2 sentences in everyday language
- Use bilingual format: `Explanation in the course language (English Term)`
- Don't mark the same term twice within the same screen
- Use `cursor: pointer` (not `cursor: help`)

---

## Numbered Step Cards

```html
<div class="step-cards stagger-children animate-in">
  <div class="step-card">
    <div class="step-num">1</div>
    <div class="step-body">
      <strong>Sampling stage</strong>
      <p>Generate G answers for each question using standard GRPO sampling</p>
    </div>
  </div>
  <div class="step-card">
    <div class="step-num">2</div>
    <div class="step-body">
      <strong>Perturbation stage</strong>
      <p>Prepend a random Lorem Ipsum prefix to some of the sampled questions</p>
    </div>
  </div>
</div>
```

---

## Icon-Label Rows

```html
<div class="icon-rows stagger-children animate-in">
  <div class="icon-row">
    <div class="icon-circle" style="background: var(--color-actor-1)">&#129513;</div>
    <div>
      <strong>Math reasoning benchmarks</strong>
      <p>Datasets such as GSM8K, MATH, and Minerva</p>
    </div>
  </div>
  <div class="icon-row">
    <div class="icon-circle" style="background: var(--color-actor-2)">&#129504;</div>
    <div>
      <strong>Model scale</strong>
      <p>Models with 1.7B, 4B, and 7B parameters</p>
    </div>
  </div>
</div>
```
