/*
 * EXPLORER TEMPLATE — copy to <course>/explorers/<name>.js and rewrite.
 * Read references/interactive-demo.md first: it says when an explorer is
 * worth building and the fidelity rules it must follow.
 *
 * The page side is a container in a module file:
 *
 *   <div class="explorer animate-in" id="explorer-euclid" data-explorer="euclid">
 *     <div class="explorer-head">
 *       <span class="explorer-kicker">Try it</span>
 *       <h3 class="explorer-title">Euclid's algorithm, one step at a time</h3>
 *       <p class="explorer-lede">What this simulates and which part of the paper it mirrors (Section, Definition, Algorithm number).</p>
 *     </div>
 *     <p class="explorer-note">Simplifications: what the model leaves out compared with the paper.</p>
 *   </div>
 *
 * main.js builds the controls, stage, checks panel, history and toolbar
 * between the head and the note. build.sh adds a <script> tag for every
 * file in explorers/, so nothing else needs wiring.
 *
 * Spec contract (all strings may contain HTML and $...$ LaTeX):
 *   params   optional [{id, label, type: 'range', min, max, step, value}
 *                      | {id, label, type: 'select', value, options: [{value, label}]}]
 *            Changing a parameter restarts the simulation from initial(params).
 *   initial(params)                -> state (a plain object; it is deep-frozen,
 *                                     so return new objects instead of mutating)
 *   actions  [{id, label, title?, hidden?,
 *              enabled?(state, params) -> bool,
 *              apply(state, params, arg) -> new state,
 *              note?(before, after, params, arg) -> string shown under the stage}]
 *            To reject an action the paper's rules forbid, throw
 *            PaperCourse.refuse('why, in the paper\'s terms'); the learner sees
 *            the reason and the state is unchanged. Any other exception is a
 *            bug: it is logged with console.error and fails the browser check.
 *   render(state, params)          -> HTML string for the stage. Elements with
 *            data-action="<action id>" (and optional data-arg="...") inside it
 *            are clickable and run that action with arg.
 *   checks   optional [{label, test(state, params) -> bool | {ok, detail}}]
 *            Live invariants, shown as "holds" / "fails". Use the paper's
 *            exact statement of the property in the label.
 *   describe optional (action, before, after, params, arg) -> history line.
 *
 * Helpers available on window.PaperCourse: refuse(msg), t(key), renderMath(el).
 *
 * The example below is deliberately unrelated to any particular paper. It
 * models Euclid's algorithm with the invariant gcd(a, b) = gcd(a0, b0) and
 * shows each feature once: a parameter, an action with enabled(), a refusal,
 * a clickable stage element, a check and a history line.
 */
(function () {
  function gcd(x, y) { while (y) { const r = x % y; x = y; y = r; } return x; }

  (window.PaperCourseExplorers = window.PaperCourseExplorers || []).push({
    name: 'euclid',
    spec: {
      params: [
        { id: 'a0', label: '$a_0$', type: 'range', min: 1, max: 120, step: 1, value: 84 },
        { id: 'b0', label: '$b_0$', type: 'range', min: 1, max: 120, step: 1, value: 36 }
      ],

      initial: params => ({ a: params.a0, b: params.b0, steps: 0 }),

      actions: [
        {
          id: 'step',
          label: 'Apply $(a, b) \\mapsto (b,\\ a \\bmod b)$',
          enabled: s => s.b !== 0,
          apply: s => ({ a: s.b, b: s.a % s.b, steps: s.steps + 1 }),
          note: (before, after) => '$' + before.a + ' \\bmod ' + before.b + ' = ' + after.b + '$'
        },
        {
          id: 'swap',
          label: 'Swap $a$ and $b$',
          apply: s => {
            if (s.b === 0) throw window.PaperCourse.refuse('With $b = 0$ the algorithm has stopped; swapping would divide by zero next step.');
            return { a: s.b, b: s.a, steps: s.steps + 1 };
          }
        },
        {
          // Not shown as a button; triggered by clicking a value in the stage.
          // Halving is deliberately NOT a legal step: it lets the learner break
          // the invariant and watch the check flip to "fails", which is how an
          // explorer shows what a theorem's condition protects.
          id: 'halve',
          label: 'Halve',
          hidden: true,
          apply: (s, params, arg) => {
            const v = s[arg];
            if (v % 2 !== 0) throw window.PaperCourse.refuse('$' + v + '$ is odd; halving is not part of the algorithm anyway.');
            return Object.assign({}, s, { [arg]: v / 2, steps: s.steps + 1 });
          }
        }
      ],

      render: s => (
        '<div style="display:flex;gap:2rem;align-items:baseline;font-size:1.25rem">' +
          '<span data-action="halve" data-arg="a" title="Click to halve">$a = ' + s.a + '$</span>' +
          '<span data-action="halve" data-arg="b" title="Click to halve">$b = ' + s.b + '$</span>' +
          '<span style="color:var(--color-text-muted);font-size:0.9rem">' + s.steps + ' steps</span>' +
        '</div>' +
        (s.b === 0 ? '<p style="margin-top:1rem">Stopped: the algorithm returns $a = ' + s.a + '$.</p>' : '')
      ),

      checks: [
        {
          label: '$\\gcd(a, b) = \\gcd(a_0, b_0)$',
          test: (s, p) => {
            const now = gcd(s.a, s.b), start = gcd(p.a0, p.b0);
            return { ok: now === start, detail: '$\\gcd(' + s.a + ', ' + s.b + ') = ' + now + '$, $\\gcd(a_0, b_0) = ' + start + '$' };
          }
        }
      ],

      describe: (action, before, after) =>
        '$(' + before.a + ', ' + before.b + ') \\to (' + after.a + ', ' + after.b + ')$'
    }
  });
})();
