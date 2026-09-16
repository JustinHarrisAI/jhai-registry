#!/usr/bin/env bash
# Drive the whole catalog: install + build + render-verify, one isolated scaffold per job.
#
# Concurrency is capped at four. Seventeen concurrent Next builds would thrash a ten-core
# machine, and run 1's harness bugs were exactly the kind that hide in interleaved output.
#
# Registries over 400 items are chunked into separate scaffolds. A single project with 1,100
# routes rebuilds too slowly for iterative failure attribution to converge inside any budget.
#
# Each job cleans up its own scaffold when it finishes: seventeen Next projects do not fit in
# the 23 GB free on this disk, and the record plus the screenshots are what the gallery needs.
set -u

ROOT="${ROOT:-/Users/justinharris/code/jhai-registry-worktrees/run2}"
OUT="${OUT:-/tmp/gallery2/out}"
WORK="${WORK:-/tmp/gallery2/work}"
SHOTS="${SHOTS:-/tmp/gallery2/shots}"
LOGS="${LOGS:-/tmp/gallery2/logs}"
LANES="${LANES:-4}"
BUDGET="${BUDGET:-45}"

mkdir -p "$OUT" "$WORK" "$SHOTS" "$LOGS"

# registry|offset|tag|port  — smaller and never-run registries first, chunked giants last, so a
# cut lands between jobs rather than through the middle of one.
JOBS=$(cat <<'EOF'
@jhai|0||4406
@pulld|0||4410
@kibo-ui|0||4414
@blocks-so|0||4418
@nusaiba|0||4422
@8bitcn|0||4426
@fancy|0||4430
@ilinxa|0||4434
@bundui|0||4438
@magicui|0||4442
@tailark-oss|0||4446
@hirael|0||4450
@vllnt-ui|0||4454
@flx|0|c0|4458
@flx|400|c1|4462
@shadcnui-blocks|0|c0|4466
@shadcnui-blocks|400|c1|4470
@ns-ui|0|c0|4474
@ns-ui|400|c1|4478
@cnippet|0|c0|4482
@cnippet|400|c1|4486
@cnippet|800|c2|4490
EOF
)

run_job() {
  IFS='|' read -r reg off tag port <<<"$1"
  slug="${reg#@}"; [ -n "$tag" ] && slug="${slug}-${tag}"
  log="$LOGS/${slug}.log"
  {
    echo "=== $reg offset=$off tag=$tag port=$port  $(date '+%H:%M:%S') ==="
    node "$ROOT/scripts/gallery/run-batch.mjs" \
      --registry "$reg" --root "$ROOT" --out "$OUT" --work "$WORK" \
      --offset "$off" --tag "$tag" --budget "$BUDGET" --max 400
    if [ -f "$OUT/${slug}.json" ]; then
      node "$ROOT/scripts/gallery/verify-render.mjs" \
        --record "$OUT/${slug}.json" --port "$port" --shots "$SHOTS"
    fi
    # The scaffold has served its purpose; the record and the screenshots are the artefacts.
    rm -rf "${WORK:?}/${slug}"
    echo "=== done $reg $(date '+%H:%M:%S') ==="
  } >>"$log" 2>&1
  echo "finished $slug"
}
export -f run_job
export ROOT OUT WORK SHOTS LOGS BUDGET

echo "$JOBS" | xargs -P "$LANES" -I{} bash -c 'run_job "$@"' _ {}
echo "ALL JOBS COMPLETE $(date '+%H:%M:%S')"
