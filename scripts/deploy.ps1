# Arsenal News Aggregator — Deployment Script (PowerShell)
# Runs entirely in userspace — no admin required

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "=== Arsenal News Aggregator — Deploy ==="
Write-Host "Project root: $ProjectRoot"

Set-Location $ProjectRoot

# 1. Install dependencies
Write-Host "--- Installing dependencies ---"
npm ci

# 2. Build all packages
Write-Host "--- Building packages ---"
npm run build

# 3. Run tests
Write-Host "--- Running tests ---"
npx vitest --run

# 4. Security scan (Semgrep via Python venv)
Write-Host "--- Running Semgrep security scan ---"
if (Test-Path ".venv/Scripts/semgrep.exe") {
    & .venv/Scripts/semgrep.exe scan --config "p/default" --config "p/owasp-top-ten" .
} else {
    Write-Host "WARN: Semgrep not installed. Run: python -m venv .venv; .venv\Scripts\pip install semgrep"
}

# 5. SBOM generation
Write-Host "--- Generating SBOM ---"
if (-not (Test-Path "./bin/syft.exe")) {
    Write-Host "WARN: Syft not installed. Install manually to ./bin/"
}
if (Test-Path "./bin/syft.exe") {
    & ./bin/syft.exe dir:. -o spdx-json | Out-File -Encoding utf8 sbom.spdx.json
}

# 6. Vulnerability scan
Write-Host "--- Scanning SBOM for vulnerabilities ---"
if (Test-Path "./bin/grype.exe") {
    & ./bin/grype.exe sbom:sbom.spdx.json
}

# 7. Deploy via CDK
Write-Host "--- Deploying to AWS ---"
npx aws-cdk deploy --all --require-approval never --app "npx ts-node --prefer-ts-exts infra/cdk-app.ts"

Write-Host "=== Deployment complete ==="
