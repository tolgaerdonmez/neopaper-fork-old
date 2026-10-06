# Interactive Demo Module (Explorers)

> **When to read this:** In Phase 3 (curriculum design), to decide whether the paper gets explorers and where, and in Phase 4 when you write one. Optional module: a course without a suitable mechanism has no explorer.

An explorer is a small, working simulation of the paper's own mechanism that the learner drives: press an operation, watch the state change, see the paper's invariants hold (or break) live. It turns "read the definition" into "try the definition". The idea comes from claude-paper's "Interactive HTML Explorer"; here it is a component inside the course, not a separate page.

---

## When to build one

Build an explorer only where the paper has a **mechanism with state that changes under operations**, and where poking at it teaches something the prose cannot. Good candidates:

- An algorithm or update rule you can step through (an optimizer step, a scheduling loop, Euclid-style iterations, a consensus round)
- A data structure or protocol with operations (push/undo, insert/rebalance, send/ack/retry)
- The objects of a definition or theorem that you can compute with small concrete values (compose two maps, apply an operator, check a condition)
- A parameterised model whose behaviour changes qualitatively with a parameter (a threshold, a learning rate, a mixing weight), when the paper discusses that change

Do **not** build one when:

- The paper is a survey, position paper, user study or purely empirical comparison with no mechanism to run (use a result comparison or an ablation toggle instead)
- The only thing to "simulate" would be a static table or a chart of reported numbers
- You would have to invent the mechanism's behaviour because the paper does not define it precisely enough

**How many:** usually one to three per course, each on the mechanism that carries the paper's main idea. One excellent explorer beats three shallow ones.

**Where:** place each explorer as a "Try it" screen inside the module that teaches the mechanism, right after the definition or derivation it simulates. If the paper has several mechanisms that interact, you may add a dedicated "Playground" module near the end that combines them; it still needs its own intro sentence and quiz.

---

## Fidelity rules (non-negotiable)

1. **Implement the paper's definitions literally.** The state, the operations and the checks follow the paper's definitions, including the cases the paper distinguishes. Do not simplify away the condition a theorem depends on.
2. **Use the paper's notation everywhere in the explorer.** Action labels, the rendered state, check labels and history lines use the paper's own symbols in LaTeX, with the same names, sub/superscripts and order of arguments. Where the explorer needs names the paper does not give (for example successive states in a run), derive them from the paper's symbols (if the paper's state is $x$, use $x_0, x_1, \dots$) and state the convention in the lede.
3. **A theorem demo must be able to tell its cases apart.** If an explorer illustrates "P holds when condition C", the learner must be able to reach both a state where C holds (and P holds) and one where C fails (and you show what breaks). Check this by hand before you finish: if the demo cannot produce the failing case, it does not illustrate the theorem. Never claim a theorem is shown when the demo only covers the trivial case.
4. **Checks are the paper's statements.** Each live check is a property the paper states or proves, labelled with the paper's formula and its number ("Lemma 3: $0 \le b_t \le B$"). Compute it from the state; never hard-code "holds".
   An unconditional theorem must stay "holds" after every action sequence the explorer allows, including resets and helper actions you added for convenience. If such a check can flip to "fails", your model is wrong, not the theorem: fix the model. Only checks of conditional properties (whose premise the learner can break) may fail.
5. **Label simplifications.** The `.explorer-note` says what the model leaves out (finite domains, integers instead of reals, one component instead of many).
6. **Do not attribute to the paper what the demo invents.** Example values are yours; say so if it matters ("ports and values are illustrative").
7. **Illegal moves are refused in the paper's terms.** If the paper forbids an operation in some state, throw `PaperCourse.refuse('...')` with the reason, citing the rule.

---

## How to write one

1. Copy `references/explorer-template.js` to `<course>/explorers/<name>.js` and replace the example. Keep the `(window.PaperCourseExplorers = window.PaperCourseExplorers || []).push({ name, spec })` wrapper.
2. Put the container in the module file (pattern: `interactive-elements.md` → Interactive Explorer). `data-explorer` must equal `name`.
3. Keep state as plain, immutable data: `apply()` returns a new object (the engine deep-freezes states, so mutation throws and fails the check). Functions may live in state when the paper's objects are functions (a map, a callback, a continuation); store them alongside a printable LaTeX label.
4. Render the state as small HTML with LaTeX. Tables, stacks drawn as lists, and inline SVG all work. Use `data-action` on stage elements for direct manipulation.
5. Write a quiz right after the explorer that asks the learner to predict what an action will do, then try it.
6. Run `bash build.sh` and the browser check. The check clicks every action button; any exception, an action that changes nothing, or an explorer that never mounts fails the build.

---

## Example shape (paper about a token-bucket rate limiter)

For a paper that defines a bucket with capacity $B$, refill rate $r$ and token count $b_t$ at time $t$, and proves a burst bound:

- **State:** $t$, $b_t$ and the list of admitted and rejected requests, rendered as a small timeline plus the bucket level.
- **Actions:** "tick ($t \mapsto t + 1$)" applying the paper's refill rule $b_{t+1} = \min(B,\ b_t + r)$, "request" admitting when $b_t \ge 1$ and refusing (with the paper's rule as the reason) otherwise, and "burst of $k$".
- **Checks:** the paper's invariant $0 \le b_t \le B$ and its burst bound, labelled with their numbers, computed from the state.
- **Theorem case split:** parameters for $B$ and $r$ so the learner can reach both a run where the bound's premise holds and one where it does not, and see which check flips.
