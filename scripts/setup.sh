#!/usr/bin/env bash
set -euo pipefail

# Arsenal News Aggregator — Full Setup Script
# Runs entirely in userspace — no sudo required

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Arsenal News Aggregator — Setup ==="
cd "$PROJECT_ROOT"

# 1. Check prerequisites
echo "--- Checking prerequisites ---"
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js not found. Install via fnm:"
  echo "  fnm install 22 && fnm use 22"
  exit 1
fi
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# 2. Install dependencies
echo "--- Installing dependencies ---"
npm ci

# 3. Build shared package first
echo "--- Building shared package ---"
npx tsc --build packages/shared/tsconfig.json

# 4. Build backend
echo "--- Building backend ---"
npx tsc --build packages/backend/tsconfig.json

# 5. Build frontend
echo "--- Building frontend ---"
cd packages/frontend && npx vite build && cd "$PROJECT_ROOT"

# 6. Bootstrap CDK (first time only)
echo "--- Bootstrapping CDK ---"
npx aws-cdk bootstrap 2>/dev/null || echo "CDK already bootstrapped or no AWS credentials"

# 7. Seed source registry
echo "--- Seeding source registry ---"
npx ts-node scripts/seed-source-registry.ts 2>/dev/null || echo "Seed skipped (no AWS credentials or table not yet created)"

# 8. Setup SES
echo "--- Setting up SES ---"
npx ts-node scripts/setup-ses.ts 2>/dev/null || echo "SES setup skipped (no AWS credentials or SES not configured)"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Set environment variables in .env (copy from .env.example)"
echo "  2. Get a free API key from https://www.football-data.org/"
echo "  3. Deploy: bash scripts/deploy.sh"
echo "  4. Or deploy via CDK directly: npx aws-cdk deploy --all"
