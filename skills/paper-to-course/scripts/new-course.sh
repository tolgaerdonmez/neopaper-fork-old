#!/bin/bash
# Creates a course directory with every verbatim file already in place.
# Usage: bash <skill-dir>/scripts/new-course.sh <course-dir>
# Copies styles.css, main.js, _footer.html, build.sh, _base.html (still with
# placeholders to fill) and the bundled KaTeX, and creates modules/ and
# explorers/. Never overwrites an existing course directory's files.
set -euo pipefail
if [ $# -ne 1 ]; then echo "usage: $0 <course-dir>" >&2; exit 2; fi
skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ref="$skill_dir/references"
dest="$1"
mkdir -p "$dest/modules" "$dest/explorers" "$dest/vendor"
for f in styles.css main.js _footer.html build.sh _base.html; do
  if [ -e "$dest/$f" ]; then echo "keep existing $dest/$f"; else cp "$ref/$f" "$dest/$f"; fi
done
[ -d "$dest/vendor/katex" ] || cp -R "$ref/vendor/katex" "$dest/vendor/katex"
echo "Course scaffold ready in $dest"
echo "Next: fill the placeholders in $dest/_base.html, write _cover.html and modules/*.html,"
echo "then: (cd $dest && bash build.sh) && uv run --no-project --with playwright python $skill_dir/scripts/check-course.py $dest/index.html"
