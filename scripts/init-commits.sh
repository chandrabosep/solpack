#!/usr/bin/env bash
#
# Initialise solpack git history as a granular, logical commit series (~37
# commits). All commits use the current real timestamp.
#
# Usage:
#   cd /Users/chandrabose/projects/solpack
#   bash scripts/init-commits.sh
#
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -d .git ]]; then
  echo "[!] .git already exists. Move or remove it first if you want a clean history:"
  echo "    rm -rf .git"
  exit 1
fi

git init -b main >/dev/null
# Override these via env if you want a different identity:
#   AUTHOR_NAME=chandrabosep AUTHOR_EMAIL=you@example.com bash scripts/init-commits.sh
git config user.name  "${AUTHOR_NAME:-chandrabosep}"
git config user.email "${AUTHOR_EMAIL:-chandrabosep3112@gmail.com}"

commit_files() {
  local msg="$1"
  shift
  local exist=()
  for p in "$@"; do
    # only stage files that exist AND aren't gitignored
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
  git commit -m "$msg" >/dev/null
  echo "  ✓ $msg"
}

# 01
commit_files "chore: init next.js 15 + typescript + tooling" \
  package.json package-lock.json tsconfig.json next.config.ts \
  eslint.config.mjs postcss.config.mjs .gitignore .env.example

# 02
commit_files "feat: lib/utils — cn, address shorten, date format" \
  lib/utils.ts

# 03
commit_files "feat: solana cluster + USDC mint config" \
  config/index.ts

# 04
commit_files "feat: base constants — currency, pricing model, x402 headers" \
  types/constants.ts

# 05
commit_files "feat: project + install log types" \
  types/projects.ts types/logs.ts

# 06
commit_files "feat: zod schemas for projects + install flow" \
  types/schemas.ts

# 07
commit_files "feat: react-query keys + axios client with wallet header" \
  query-keys/query-keys.ts lib/api/client.ts

# 08
commit_files "feat: wallet address hook + server-side header auth" \
  lib/auth/use-wallet-address.ts lib/auth/wallet-auth.ts

# 09
commit_files "feat: solana wallet adapter providers (phantom + solflare)" \
  context/index.tsx

# 10
commit_files "feat: connect button — ssr-safe wallet multi button" \
  components/common/connect-btn.tsx

# 11
commit_files "feat: sidebar nav + layout shell (path-aware sidebar)" \
  components/common/sidebar.tsx components/common/layout-shell.tsx

# 12
commit_files "feat: root layout + globals.css solana dark theme" \
  app/layout.tsx app/globals.css

# 13
commit_files "feat(ui): button primitive with cva variants" \
  components/ui/button.tsx

# 14
commit_files "feat(ui): card primitive (header / title / content / footer)" \
  components/ui/card.tsx

# 15
commit_files "feat(ui): input + label + textarea" \
  components/ui/input.tsx components/ui/label.tsx components/ui/textarea.tsx

# 16
commit_files "feat(ui): badge + separator" \
  components/ui/badge.tsx components/ui/separator.tsx

# 17
commit_files "feat(ui): copy-to-clipboard button" \
  components/ui/copy-button.tsx

# 18
commit_files "feat(ui): dialog (radix-based)" \
  components/ui/dialog.tsx

# 19
commit_files "feat(ui): alert dialog" \
  components/ui/alert-dialog.tsx

# 20
commit_files "feat(ui): select" \
  components/ui/select.tsx

# 21
commit_files "feat(ui): dropdown menu" \
  components/ui/dropdown-menu.tsx

# 22
commit_files "feat: prisma schema (developer / project / apikey / pricing / install)" \
  prisma/schema.prisma prisma.config.ts

# 23
commit_files "feat: prisma client with pg adapter + url cleanup" \
  lib/prisma/client.ts

# 24
commit_files "feat: project service — list / get / create / update / rotate / delete" \
  lib/x402/project-service.ts

# 25
commit_files "feat: project crud api routes (/api/projects)" \
  app/api/projects/route.ts app/api/projects/\[id\]/route.ts

# 26
commit_files "feat: dashboard stats + logs api" \
  app/api/dashboard/stats/route.ts app/api/logs/route.ts

# 27
commit_files "feat: react-query controllers — projects, dashboard, logs" \
  controllers/projects.query.ts controllers/projects.mutations.ts \
  controllers/dashboard.query.ts controllers/logs.query.ts

# 28
commit_files "feat: solana on-chain payment verification (SPL + system transfer)" \
  lib/payments/verify-onchain.ts lib/payments/sessions.ts

# 29
commit_files "feat: install service (x402 start / status / confirm / verify)" \
  lib/x402/install-service.ts

# 30
commit_files "feat: install api — start (POST, returns 402 with x402 headers)" \
  app/api/install/start/route.ts

# 31
commit_files "feat: install api — status (POST + GET poll)" \
  app/api/install/status/route.ts

# 32
commit_files "feat: install api — confirm (finalize after payment)" \
  app/api/install/confirm/route.ts

# 33
commit_files "feat: install api — verify (pay page submits signature)" \
  app/api/install/verify/route.ts

# 34
commit_files "feat: install api — session read + legacy redirect" \
  app/api/install/session/route.ts \
  app/api/install/session/\[sessionId\]/route.ts

# 35
commit_files "feat: landing page — hero, why-solpack, how-it-works, features" \
  app/page.tsx components/landing-ui/Hero.tsx \
  components/landing-ui/ReuseableCard.tsx

# 36
commit_files "feat: dashboard page — stat cards + packages table" \
  app/dashboard/page.tsx

# 37
commit_files "feat: projects list + create-package dialog" \
  app/projects/page.tsx \
  components/projects/create-package-button.tsx \
  components/projects/project-form.tsx \
  components/projects/project-card.tsx \
  components/projects/new-project-card.tsx \
  components/projects/dashboard-package-row.tsx

# 38
commit_files "feat: project detail page — credentials + integration guide" \
  app/projects/\[id\]/page.tsx \
  components/projects/project-detail-page.tsx \
  components/projects/project-detail-header.tsx \
  components/projects/project-package-info-card.tsx \
  components/projects/project-preinstall-card.tsx

# 39
commit_files "feat: logs page with cursor pagination" \
  app/logs/page.tsx app/\(routes\)/layout.tsx

# 40
commit_files "feat: pay page — USDC transferChecked + SOL system transfer on devnet" \
  app/pay/page.tsx app/pay/\[sessionId\]/page.tsx

# 41
commit_files "feat: preinstall.js template with paid-package cost banner" \
  config/package/preinstall.js

# 42
commit_files "chore: deprecate legacy file-backed store (replaced by prisma)" \
  lib/store/file-store.ts

# 43
commit_files "docs: readme + supabase setup + payment flow + commit script" \
  README.md scripts/init-commits.sh

# Catch-all for anything not explicitly listed.
git add -A
if ! git diff --cached --quiet; then
  git commit -m "chore: misc tracked files" >/dev/null
  echo "  ✓ chore: misc tracked files"
fi

echo ""
total=$(git rev-list --count HEAD)
echo "Done — $total commits."
echo ""
echo "History:"
git --no-pager log --oneline
