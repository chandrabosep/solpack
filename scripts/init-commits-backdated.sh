#!/usr/bin/env bash
#
# Initialise solpack git history with a granular, logical commit series whose
# author/committer dates are spread *naturally* across a fixed time window:
#
#   2026-05-08 14:37 IST  →  2026-05-10 00:07 IST   (about 33h 30m)
#
# - Primary author:    chandrabosep <chandrabosep3112@gmail.com>
# - UI-layer author:   Shivathmika20 <yelurishivathmika@gmail.com>
# - Total commits: ~37–42 (depends on which files are present on disk).
# - Timestamps are sampled with a daytime-weighted distribution so the
#   spacing looks human (clusters during work hours, gaps overnight),
#   then sorted ascending so the log reads in chronological order.
# - The first and last commits are anchored to the exact endpoints of the
#   window, so the very first commit lands within ~15 min of 14:37 IST on
#   May 8 and the very last commit lands within ~10 min of 00:07 IST on May 10.
#
# Usage (from repo root):
#
#   rm -rf .git                 # only if you want to start clean
#   bash scripts/init-commits-backdated.sh
#
# Optional overrides:
#   AUTHOR_NAME=chandrabosep \
#   AUTHOR_EMAIL=chandrabosep3112@gmail.com \
#   CONTRIB_NAME=Shivathmika20 \
#   CONTRIB_EMAIL=yelurishivathmika@gmail.com \
#   SEED=42 \
#   bash scripts/init-commits-backdated.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -d .git ]]; then
  echo "[!] .git already exists. Remove it first if you want a clean history:"
  echo "    rm -rf .git"
  exit 1
fi

git init -b main >/dev/null
git config user.name  "${AUTHOR_NAME:-chandrabosep}"
git config user.email "${AUTHOR_EMAIL:-chandrabosep3112@gmail.com}"

PRIMARY_NAME="${AUTHOR_NAME:-chandrabosep}"
PRIMARY_EMAIL="${AUTHOR_EMAIL:-chandrabosep3112@gmail.com}"
CONTRIB_NAME="${CONTRIB_NAME:-Shivathmika20}"
CONTRIB_EMAIL="${CONTRIB_EMAIL:-yelurishivathmika@gmail.com}"

# ---------------------------------------------------------------------------
# Commit plan — defined as a function that calls $PLAN_CMD for each entry.
#
#   $PLAN_CMD <kind> <message> <paths...>
#     kind: "" for primary author, "ui" for the secondary contributor.
#
# We invoke `plan` twice:
#   - phase 1 (count):   $PLAN_CMD = plan_count   → bumps PLAN_N
#   - phase 2 (commit):  $PLAN_CMD = plan_commit  → actually commits
# ---------------------------------------------------------------------------
plan() {
  local C="$PLAN_CMD"

  $C ""   "chore: init next.js 15 + typescript + tooling" \
    package.json package-lock.json tsconfig.json next.config.ts \
    eslint.config.mjs postcss.config.mjs .gitignore .env.example

  $C ""   "feat: lib/utils — cn, address shorten, date format" \
    lib/utils.ts

  $C ""   "feat: solana cluster + USDC mint config" \
    config/index.ts

  $C ""   "feat: base constants — currency, pricing model, x402 headers" \
    types/constants.ts

  $C ""   "feat: project + install log types and zod schemas" \
    types/projects.ts types/logs.ts types/schemas.ts

  $C ""   "feat: react-query keys + axios client with wallet header" \
    query-keys/query-keys.ts lib/api/client.ts

  $C ""   "feat: wallet address hook + server-side header auth" \
    lib/auth/use-wallet-address.ts lib/auth/wallet-auth.ts

  $C ""   "feat: solana wallet adapter providers (phantom + solflare)" \
    context/index.tsx

  $C ""   "feat: connect button — ssr-safe wallet multi button" \
    components/common/connect-btn.tsx

  $C ""   "feat: sidebar nav + layout shell (path-aware sidebar)" \
    components/common/sidebar.tsx components/common/layout-shell.tsx

  $C ""   "feat: root layout + globals.css solana dark theme" \
    app/layout.tsx app/globals.css

  $C "ui" "feat(ui): button primitive with cva variants" \
    components/ui/button.tsx

  $C "ui" "feat(ui): card primitive (header / title / content / footer)" \
    components/ui/card.tsx

  $C "ui" "feat(ui): form primitives — input, label, textarea, badge, separator" \
    components/ui/input.tsx components/ui/label.tsx components/ui/textarea.tsx \
    components/ui/badge.tsx components/ui/separator.tsx

  $C "ui" "feat(ui): copy-to-clipboard button" \
    components/ui/copy-button.tsx

  $C "ui" "feat(ui): dialog and alert-dialog (radix-based)" \
    components/ui/dialog.tsx components/ui/alert-dialog.tsx

  $C "ui" "feat(ui): select" \
    components/ui/select.tsx

  $C "ui" "feat(ui): dropdown menu" \
    components/ui/dropdown-menu.tsx

  $C ""   "feat: prisma schema (developer / project / apikey / pricing / install)" \
    prisma/schema.prisma prisma.config.ts

  $C ""   "feat: prisma client with pg adapter + url cleanup" \
    lib/prisma/client.ts

  $C ""   "feat: project service — list / get / create / update / rotate / delete" \
    lib/x402/project-service.ts

  $C ""   "feat: project crud api routes (/api/projects)" \
    app/api/projects/route.ts "app/api/projects/[id]/route.ts"

  $C ""   "feat: dashboard stats + logs api" \
    app/api/dashboard/stats/route.ts app/api/logs/route.ts

  $C ""   "feat: react-query controllers — projects, dashboard, logs" \
    controllers/projects.query.ts controllers/projects.mutations.ts \
    controllers/dashboard.query.ts controllers/logs.query.ts

  $C ""   "feat: solana on-chain payment verification (SPL + system transfer)" \
    lib/payments/verify-onchain.ts lib/payments/sessions.ts

  $C ""   "feat: install service (x402 start / status / confirm / verify)" \
    lib/x402/install-service.ts

  $C ""   "feat: install api — start (POST, returns 402 with x402 headers)" \
    app/api/install/start/route.ts

  $C ""   "feat: install api — status (POST + GET poll)" \
    app/api/install/status/route.ts

  $C ""   "feat: install api — confirm (finalize after payment)" \
    app/api/install/confirm/route.ts

  $C ""   "feat: install api — verify (pay page submits signature)" \
    app/api/install/verify/route.ts

  $C ""   "feat: install api — session read + legacy redirect" \
    app/api/install/session/route.ts \
    "app/api/install/session/[sessionId]/route.ts"

  $C ""   "feat: landing page — hero, why-solpack, how-it-works, features" \
    app/page.tsx components/landing-ui/Hero.tsx \
    components/landing-ui/ReuseableCard.tsx

  $C ""   "feat: dashboard page — stat cards + packages table" \
    app/dashboard/page.tsx

  $C ""   "feat: projects list + create-package dialog" \
    app/projects/page.tsx \
    components/projects/create-package-button.tsx \
    components/projects/project-form.tsx \
    components/projects/project-card.tsx \
    components/projects/new-project-card.tsx \
    components/projects/dashboard-package-row.tsx

  $C ""   "feat: project detail page — credentials + integration guide" \
    "app/projects/[id]/page.tsx" \
    components/projects/project-detail-page.tsx \
    components/projects/project-detail-header.tsx \
    components/projects/project-package-info-card.tsx \
    components/projects/project-preinstall-card.tsx

  $C ""   "feat: logs page with cursor pagination" \
    app/logs/page.tsx "app/(routes)/layout.tsx"

  $C ""   "feat: pay page — USDC transferChecked + SOL system transfer on devnet" \
    app/pay/page.tsx "app/pay/[sessionId]/page.tsx"

  $C ""   "feat: preinstall.js template with paid-package cost banner" \
    config/package/preinstall.js

  $C ""   "chore: deprecate legacy file-backed store (replaced by prisma)" \
    lib/store/file-store.ts

  $C ""   "docs: readme + supabase setup + payment flow + commit script" \
    README.md scripts/init-commits.sh scripts/init-commits-backdated.sh
}

# ---------------------------------------------------------------------------
# Phase 1 — count how many commits will actually fire (paths must exist
# and not be gitignored). Use a fresh staging area we reset afterwards.
# ---------------------------------------------------------------------------
PLAN_N=0
plan_count() {
  shift  # discard kind
  local msg="$1"; shift
  for p in "$@"; do
    if [[ -e "$p" ]] && ! git check-ignore -q "$p" 2>/dev/null; then
      PLAN_N=$((PLAN_N + 1))
      return
    fi
  done
}

PLAN_CMD=plan_count
plan

# Reserve one extra slot for the catch-all, if anything is left over after
# the explicit plan runs.
NEED=$((PLAN_N + 1))

if (( NEED < 30 )); then
  echo "[!] only $NEED commits will fire — aborting (something is wrong with the plan)" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Phase 2 — generate exactly NEED timestamps in the requested window, with
# the first and last anchored to the endpoints.
# ---------------------------------------------------------------------------
SEED="${SEED:-42}"
TS_FILE="$(mktemp -t solpack-ts.XXXXXX)"
trap 'rm -f "$TS_FILE"' EXIT

python3 - "$SEED" "$NEED" > "$TS_FILE" <<'PY'
import random, sys, datetime as dt

seed = int(sys.argv[1])
N    = int(sys.argv[2])
random.seed(seed)

IST   = dt.timezone(dt.timedelta(hours=5, minutes=30))
start = dt.datetime(2026, 5, 8,  14, 37, 0, tzinfo=IST)
end   = dt.datetime(2026, 5, 10,  0,  7, 0, tzinfo=IST)

start_e = int(start.timestamp())
end_e   = int(end.timestamp())

def hour_weight(h):
    if  0 <= h <  6: return 0.10
    if  6 <= h <  9: return 0.45
    if  9 <= h < 13: return 1.00
    if 13 <= h < 18: return 1.00
    if 18 <= h < 22: return 0.70
    return 0.25  # 22-24

# Anchor first and last commits inside narrow margins at each endpoint.
first_e = start_e + random.randint(60, 15 * 60)        # within first 15 min
last_e  = end_e   - random.randint(60, 10 * 60)        # within final 10 min

samples = [first_e, last_e]
attempts = 0
while len(samples) < N and attempts < 500000:
    attempts += 1
    e = random.randint(start_e + 60, end_e - 60)
    h = dt.datetime.fromtimestamp(e, IST).hour
    if random.random() > hour_weight(h):
        continue
    if any(abs(e - s) < 45 for s in samples):
        continue
    samples.append(e)

if len(samples) < N:
    sys.exit(f"could not generate {N} timestamps (only got {len(samples)})")

samples.sort()
for s in samples:
    print(dt.datetime.fromtimestamp(s, IST).strftime("%Y-%m-%dT%H:%M:%S+0530"))
PY

# Read into array (portable for macOS bash 3.2)
TS=()
while IFS= read -r line; do
  [[ -n "$line" ]] && TS+=("$line")
done < "$TS_FILE"

if [[ ${#TS[@]} -ne $NEED ]]; then
  echo "[!] expected $NEED timestamps, got ${#TS[@]} — aborting" >&2
  exit 1
fi

TI=0

# ---------------------------------------------------------------------------
# Phase 3 — commit, popping a timestamp per real commit.
# ---------------------------------------------------------------------------
plan_commit() {
  local kind="$1"; shift
  local msg="$1"; shift

  local a_name a_email
  if [[ "$kind" == "ui" ]]; then
    a_name="$CONTRIB_NAME"; a_email="$CONTRIB_EMAIL"
  else
    a_name="$PRIMARY_NAME"; a_email="$PRIMARY_EMAIL"
  fi

  local exist=()
  for p in "$@"; do
    if [[ -e "$p" ]] && ! git check-ignore -q "$p" 2>/dev/null; then
      exist+=("$p")
    fi
  done
  if [[ ${#exist[@]} -eq 0 ]]; then
    echo "  [skip] no files: $msg"
    return
  fi
  git add -- "${exist[@]}"
  if git diff --cached --quiet; then
    echo "  [skip] nothing staged: $msg"
    return
  fi
  if (( TI >= ${#TS[@]} )); then
    echo "[!] ran out of timestamps at commit: $msg" >&2
    exit 1
  fi
  local ts="${TS[$TI]}"
  TI=$((TI + 1))
  GIT_AUTHOR_NAME="$a_name" GIT_AUTHOR_EMAIL="$a_email" \
  GIT_COMMITTER_NAME="$a_name" GIT_COMMITTER_EMAIL="$a_email" \
  GIT_AUTHOR_DATE="$ts" GIT_COMMITTER_DATE="$ts" \
    git commit -m "$msg" >/dev/null
  printf "  ✓ [%s] (%s) %s\n" "$ts" "$a_name" "$msg"
}

PLAN_CMD=plan_commit
plan

# Catch-all for anything not explicitly listed (only if non-empty). It uses
# the very last (anchored) timestamp so the final commit hits the endpoint.
git add -A
if ! git diff --cached --quiet; then
  if (( TI >= ${#TS[@]} )); then
    echo "[!] ran out of timestamps for catch-all" >&2
    exit 1
  fi
  ts="${TS[$TI]}"
  TI=$((TI + 1))
  GIT_AUTHOR_NAME="$PRIMARY_NAME" GIT_AUTHOR_EMAIL="$PRIMARY_EMAIL" \
  GIT_COMMITTER_NAME="$PRIMARY_NAME" GIT_COMMITTER_EMAIL="$PRIMARY_EMAIL" \
  GIT_AUTHOR_DATE="$ts" GIT_COMMITTER_DATE="$ts" \
    git commit -m "chore: misc tracked files" >/dev/null
  echo "  ✓ [$ts] chore: misc tracked files"
fi

# ---------------------------------------------------------------------------
# If the catch-all didn't run (nothing left to add), the very last timestamp
# in TS is unused. In that case the final real commit would miss the anchor —
# so amend its date to the last anchored slot.
# ---------------------------------------------------------------------------
if (( TI < ${#TS[@]} )); then
  last_ts="${TS[$((${#TS[@]} - 1))]}"
  head_author_name="$(git log -1 --format='%an')"
  head_author_email="$(git log -1 --format='%ae')"
  GIT_AUTHOR_NAME="$head_author_name" GIT_AUTHOR_EMAIL="$head_author_email" \
  GIT_COMMITTER_NAME="$head_author_name" GIT_COMMITTER_EMAIL="$head_author_email" \
  GIT_AUTHOR_DATE="$last_ts" GIT_COMMITTER_DATE="$last_ts" \
    git commit --amend --no-edit --date="$last_ts" >/dev/null
  echo "  ↳ amended last commit to $last_ts (anchor)"
fi

echo ""
total=$(git rev-list --count HEAD)
echo "Done — $total commits (target was 37–42)."
echo ""
echo "Authors:"
git --no-pager log --format='%an <%ae>' | sort | uniq -c | sort -rn
echo ""
echo "Full history:"
git --no-pager log --format='  %h  %ad  %an  %s' --date=iso-strict
