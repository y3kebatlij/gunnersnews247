# Arsenal News Aggregator

Serverless, event-driven platform that collects Arsenal FC news from global sources, curates daily digests, and delivers a real-time experience to fans.

## Getting Started

### Prerequisites

- **fnm** (Fast Node Manager) — installs in userspace, no admin needed
  - Windows: `winget install Schniz.fnm`
  - macOS/Linux: `curl -fsSL https://fnm.vercel.app/install | bash`
- **Python 3.11+** (for Semgrep only)
- **AWS credentials** configured (`~/.aws/credentials` or env vars)

### Setup

```bash
# Install and use Node.js 22
fnm install 22
fnm use 22

# Install dependencies (all local, no global installs)
npm ci

# Build shared package (must be first)
npx tsc --build packages/shared/tsconfig.json

# Build backend
npx tsc --build packages/backend/tsconfig.json

# Build frontend
cd packages/frontend && npx vite build && cd ../..

# Create Python venv for Semgrep (optional)
python3 -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\Activate.ps1 on Windows
pip install semgrep
```

### Windows (fnm + PowerShell workaround)

If PowerShell blocks npm.ps1, use `npm.cmd` directly:
```powershell
$env:PATH = "$env:APPDATA\fnm\node-versions\v22.22.2\installation;" + $env:PATH
npm.cmd install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:
```bash
cp .env.example .env
```

Key variables:
- `FOOTBALL_DATA_API_KEY` — Free key from [football-data.org](https://www.football-data.org/)
- `SES_SENDER_EMAIL` — Verified email for sending daily digests
- `AWS_REGION` — Default: us-east-1

### Deploy

```bash
# First time: bootstrap CDK
npx aws-cdk bootstrap

# Seed the source registry (37 sources, 10 countries)
npx ts-node scripts/seed-source-registry.ts

# Setup SES (verify sender email, create template)
npx ts-node scripts/setup-ses.ts

# Deploy everything
npx aws-cdk deploy --all

# Or use the all-in-one deploy script
bash scripts/deploy.sh
```

### Running Tests

```bash
npx vitest --run
```

### Running Semgrep

```bash
.venv/bin/semgrep scan --config "p/default" --config "p/owasp-top-ten" .
```

## Project Structure

```
packages/
  shared/      — TypeScript interfaces and constants
  backend/     — AWS Lambda handlers
    src/
      aggregator/  — News crawling (RSS + web scrape), duration labels, summaries
      digest/      — Daily email digest compilation and SES delivery
      match/       — Live scores, lineups, standings via football-data.org
      realtime/    — WebSocket connection management and broadcasting
      api/         — REST API routes and subscriber management
  frontend/    — React/Vite SPA with USWDS styling
    src/
      components/  — 19 React components (feed, scoreboard, standings, etc.)
      context/     — Theme and WebSocket providers
      styles/      — USWDS, dark mode, responsive overrides
infra/           — CDK stack (DynamoDB, Lambda, API Gateway, S3, CloudFront, EventBridge)
scripts/         — Deploy, seed, and SES setup scripts
```

## Source Coverage

37 sources across 10 countries: England, Spain, France, Germany, Italy, USA, Brazil, Argentina, Nigeria, India, Australia. Includes articles, blogs, newspapers, podcasts, and video channels.

## Architecture

- **Backend**: TypeScript, AWS Lambda, DynamoDB, SES, EventBridge, API Gateway, WebSocket API
- **Frontend**: React 19, Vite, TypeScript, USWDS, Section 508 accessible
- **Infrastructure**: AWS CDK, S3 + CloudFront, all serverless
- **No admin required**: Everything runs in userspace via fnm, npm, and local tool installs
