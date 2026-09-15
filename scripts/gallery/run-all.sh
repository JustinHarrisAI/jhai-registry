#!/bin/bash
# Drive every wired registry through the batch runner.
#
# Ordered SMALLEST FIRST, deliberately. Each registry banks a complete result file the moment
# it finishes, so if the run is cut short the boundary falls between registries rather than
# through the middle of one. The big ones (@cnippet 1130, @ns-ui 542) go last because they are
# the ones most likely to be the thing that did not finish.
cd /Users/justinharris/code/jhai-registry
OUT=/tmp/gallery/out
WORK=/tmp/gallery/work
mkdir -p "$OUT" "$WORK"

for R in @kibo-ui @blocks-so @pulld @nusaiba @8bitcn @fancy @ilinxa @bundui @magicui @tailark-oss @vllnt-ui @flx @shadcnui-blocks @ns-ui @cnippet; do
  SLUG="${R#@}"
  if [ -f "$OUT/$SLUG.json" ]; then echo "SKIP $R (done)"; continue; fi
  echo "=== $R $(date +%H:%M:%S) ==="
  node scripts/gallery/run-batch.mjs --registry "$R" --out "$OUT" --work "$WORK" 2>&1 | tail -4
  rm -rf "$WORK/$SLUG"      # reclaim disk; node_modules per project is ~400MB
done
echo "ALL DONE $(date +%H:%M:%S)"
