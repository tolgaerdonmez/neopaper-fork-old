#!/bin/bash
# Assembles the course from parts.
# Run from the course directory: bash build.sh
set -e
{
  cat _base.html _cover.html modules/*.html
  # Explorer simulations (optional): one script per explorers/<name>.js.
  for f in explorers/*.js; do
    [ -e "$f" ] && echo "<script defer src=\"$f\"></script>"
  done
  cat _footer.html
} > index.html
echo "Built index.html. Now run the browser check (scripts/check-course.py) before calling it done."
