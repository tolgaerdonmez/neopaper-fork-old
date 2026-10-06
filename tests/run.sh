#!/bin/bash
# Regression test for the skill itself: builds a fixture course that uses
# every documented component and must PASS the browser check, and a broken
# fixture that must FAIL with the expected reasons.
# Usage: bash tests/run.sh   (needs uv; uses Playwright's own Chromium)
set -uo pipefail
repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
skill="$repo/skills/paper-to-course"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
check() { uv run --no-project --with playwright python "$skill/scripts/check-course.py" "$@"; }

fill_base() { # <course-dir> <title> <modules...>
  local dir="$1" title="$2"; shift 2
  local dots="" items="" i=0
  for m in "$@"; do
    dots+="<button class=\"nav-dot\" data-target=\"module-$i\" aria-label=\"$m\"></button>"
    items+="<a class=\"sidebar-item\" data-module=\"$i\" href=\"#module-$i\">$m</a>"
    i=$((i + 1))
  done
  python3 - "$dir/_base.html" "$title" "$dots" "$items" <<'PY'
import sys
p, title, dots, items = sys.argv[1:]
s = open(p).read()
for k, v in {"COURSE_LANG": "en", "COURSE_TITLE": title, "COURSE_UI_STRINGS": "{}",
             "ACCENT_COLOR": "#2A7B9B", "ACCENT_HOVER": "#1F6280", "ACCENT_LIGHT": "#E4F2F7",
             "ACCENT_MUTED": "#5A9DB8", "NAV_DOTS": dots, "SIDEBAR_ITEMS": items}.items():
    s = s.replace(k, v)
open(p, "w").write(s)
PY
}

status=0

good="$work/good"
bash "$skill/scripts/new-course.sh" "$good" >/dev/null
fill_base "$good" "Fixture course" "Basics" "Everything else"
cp "$repo/tests/fixture/_cover.html" "$good/"
cp "$repo/tests/fixture/modules/"*.html "$good/modules/"
cp "$repo/tests/fixture/euclid.js" "$good/explorers/euclid.js"
(cd "$good" && bash build.sh >/dev/null)
if check "$good/index.html"; then echo "ok: fixture passes"; else echo "FAILED: fixture should pass"; status=1; fi

bad="$work/bad"
bash "$skill/scripts/new-course.sh" "$bad" >/dev/null
fill_base "$bad" "Broken fixture" "Broken"
cp "$repo/tests/fixture-broken/_cover.html" "$bad/"
cp "$repo/tests/fixture-broken/modules/"*.html "$bad/modules/"
(cd "$bad" && bash build.sh >/dev/null)
out="$(check "$bad/index.html")"
if [ $? -eq 0 ]; then echo "FAILED: broken fixture should fail"; status=1; fi
for want in "callout component used" "emoji found" "left-stripe box" "raw LaTeX left as text" "KaTeX could not parse" \
            "no .pseudocode-next-btn found" "was never mounted" "diagram label clipped"; do
  if grep -q "$want" <<<"$out"; then echo "ok: broken fixture reports: $want"; else echo "FAILED: broken fixture did not report: $want"; status=1; fi
done
[ $status -eq 0 ] && echo "ALL TESTS PASSED" || { echo "$out"; echo "TESTS FAILED"; }
exit $status
