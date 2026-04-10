#!/usr/bin/env bash
set -euo pipefail

# Arsenal News Aggregator — Deployment Script (Bash)
# Runs entirely in userspace — no sudo required

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== Arsenal News Aggregator — Deploy ==="
echo "Project root: $PROJECT_ROOT"

cd "$PROJECT_ROOT"

# 1. Install dependencies
echo "--- Installing dependencies ---"
npm ci

# 2. Build all packages
echo "--- Building packages ---"
npm run build

# 3. Run tests
echo "--- Running tests ---"
npx vitest --run

# 4. Security scan (Semgrep via Python venv)
echo "--- Running Semgrep security scan ---"
if [ -f ".venv/bin/semgrep" ]; then
  .venv/bin/semgrep scan --config "p/default" --config "p/owasp-top-ten" .
else
  echo "WARN: Semgrep not installed. Run: python3 -m venv .venv && .venv/bin/pip install semgrep"
fi

# 5. SBOM generation (Syft — local install)
echo "--- Generating SBOM ---"
if [ ! -f "./bin/syft" ]; then
  echo "Installing Syft to ./bin/ ..."
  curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b ./bin
fi
./bin/syft dir:. -o spdx-json > sbom.spdx.json

# 6. Vulnerability scan (Grype — local install)
echo "--- Scanning SBOM for vulnerabilities ---"
if [ ! -f "./bin/grype" ]; then
  echo "Installing Grype to ./bin/ ..."
  curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b ./bin
fi
./bin/grype sbom:sbom.spdx.json

# 7. Deploy via CDK
echo "--- Deploying to AWS ---"
npx aws-cdk deploy --all --require-approval never --app "npx ts-node --prefer-ts-exts infra/cdk-app.ts"

echo "=== Deployment complete ==="
