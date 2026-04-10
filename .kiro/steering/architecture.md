---
inclusion: always
---

# Architecture Standards

## 12-Factor App Design

All applications must follow the 12-Factor methodology (https://12factor.net):

1. **Codebase:** One codebase tracked in version control, many deploys.
2. **Dependencies:** Explicitly declare and isolate dependencies. Never rely on system-wide packages. Use lock files (package-lock.json, requirements.txt with pinned versions).
3. **Config:** Store configuration in environment variables. Never hardcode credentials, URLs, or environment-specific values. Use `.env` files for local development (and .gitignore them).
4. **Backing Services:** Treat databases, caches, queues, and external APIs as attached resources. Swap them via config, not code changes.
5. **Build, Release, Run:** Strictly separate build, release, and run stages. The build stage produces an artifact. The release stage combines it with config. The run stage executes it.
6. **Processes:** Applications should be stateless. Store shared state in a backing service (database, cache), not in memory or on the local filesystem.
7. **Port Binding:** Export services via port binding. The app is self-contained and does not rely on an external web server injection.
8. **Concurrency:** Scale out via the process model. Design for horizontal scaling, not vertical.
9. **Disposability:** Maximize robustness with fast startup and graceful shutdown. Applications should handle SIGTERM cleanly.
10. **Dev/Prod Parity:** Keep development, staging, and production as similar as possible. Use the same backing services, OS, and dependency versions.
11. **Logs:** Treat logs as event streams. Write to stdout/stderr. Let the execution environment handle log routing and aggregation.
12. **Admin Processes:** Run admin/management tasks as one-off processes using the same codebase and config as the app.

## AWS Well-Architected Framework

When designing for AWS, follow the six pillars:

- **Operational Excellence:** Automate operations, make frequent small changes, anticipate failure, learn from events. Use Infrastructure as Code.
- **Security:** Apply security at all layers. Enable traceability. Automate security best practices. Protect data in transit and at rest. Prepare for security events.
- **Reliability:** Automatically recover from failure. Test recovery procedures. Scale horizontally. Stop guessing capacity. Manage change through automation.
- **Performance Efficiency:** Use the right resource types and sizes. Make informed decisions with data. Use managed services where possible. Experiment and iterate.
- **Cost Optimization:** Adopt a consumption model. Measure overall efficiency. Stop spending money on undifferentiated heavy lifting. Analyze and attribute expenditure.
- **Sustainability:** Understand your impact. Establish sustainability goals. Maximize utilization. Use managed services to reduce downstream impact.

Reference: https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html

## Application Security

### OWASP Top 10 (2025)

All applications must be designed to mitigate the OWASP Top 10 risks. Reference: https://owasp.org/www-project-top-ten/

1. **A01 — Broken Access Control:** Enforce access control server-side. Deny by default. Never rely on client-side checks alone. Validate permissions on every request, not just at the UI layer.
2. **A02 — Security Misconfiguration:** Remove default credentials, disable unnecessary features and endpoints, keep error messages generic in production. Automate configuration hardening.
3. **A03 — Software and Data Integrity Failures (Supply Chain):** Verify the integrity of dependencies. Use lock files. Pin dependency versions. Review third-party packages before adoption. Use tools like `npm audit` or `pip-audit`.
4. **A04 — Cryptographic Failures:** Use strong, current algorithms (AES-256, SHA-256+). Never roll your own crypto. Encrypt data in transit (TLS 1.2+) and at rest. Don't log or expose sensitive data in error messages.
5. **A05 — Injection:** Use parameterized queries for all database access. Never concatenate user input into SQL, shell commands, or OS calls. Validate and sanitize all input.
6. **A06 — Insecure Design:** Threat model before you build. Identify trust boundaries, data flows, and attack surfaces during design — not after deployment. Use secure design patterns (e.g., principle of least privilege, defense in depth).
7. **A07 — Vulnerable and Outdated Components:** Keep dependencies up to date. Monitor for CVEs. Remove unused dependencies. Prefer well-maintained libraries with active security response.
8. **A08 — Identification and Authentication Failures:** Use proven authentication libraries/services. Enforce strong passwords or passphrase policies. Implement rate limiting on login endpoints. Use multi-factor authentication where possible.
9. **A09 — Security Logging and Monitoring Failures:** Log authentication events, access control failures, and input validation failures. Don't log sensitive data (passwords, tokens, PII). Ensure logs are tamper-resistant and monitored.
10. **A10 — Server-Side Request Forgery (SSRF):** Validate and sanitize all URLs the application fetches. Use allowlists for permitted domains/IPs. Don't let user input directly control outbound requests.

### NIST Secure Software Development Framework (SSDF) — SP 800-218

The SSDF organizes secure development into four practice groups. These apply to all software we build, and are required for software sold to the US federal government. Reference: https://csrc.nist.gov/pubs/sp/800/218/final

- **Prepare the Organization (PO):** Define security requirements. Ensure developers have security training. Establish roles and responsibilities for secure development.
- **Protect the Software (PS):** Protect all code, builds, and releases from unauthorized access and tampering. Use version control with access controls. Sign releases. Secure CI/CD pipelines.
- **Produce Well-Secured Software (PW):** Design software to meet security requirements. Review and test code for vulnerabilities. Use automated analysis tools (SAST, SCA). Remediate vulnerabilities before release.
- **Respond to Vulnerabilities (RV):** Monitor for and respond to reported vulnerabilities. Have a process for receiving, triaging, and fixing security issues. Communicate fixes to users.

### Linux Foundation — Secure Software Development (LFD121)

The Linux Foundation's free course on developing secure software is recommended reading for all participants. It covers input validation, secure design principles, dependency management, and vulnerability response. Reference: https://training.linuxfoundation.org/training/developing-secure-software-lfd121

Key takeaways to apply in all code:

- **Input validation:** Always use allowlists over denylists. Validate type, length, range, and format. Reject anything that doesn't match expected patterns.
- **Output encoding:** Encode output based on context (HTML, URL, JavaScript, SQL) to prevent injection and XSS.
- **Least privilege:** Run processes with the minimum permissions needed. Don't run as root. Don't request broad OAuth scopes.
- **Defense in depth:** Don't rely on a single security control. Layer protections — input validation + parameterized queries + WAF, not just one.
- **Fail securely:** When something goes wrong, fail closed (deny access) rather than fail open. Don't expose stack traces or internal details in error responses.
- **Dependency hygiene:** Evaluate dependencies before adding them. Fewer dependencies = smaller attack surface. Keep what you use up to date.

### Static Analysis with Semgrep

Use Semgrep Community Edition (CE) for local static application security testing (SAST). Semgrep runs locally, requires no account for basic use, supports 30+ languages, and scans fast enough to run on every save or before every commit. Reference: https://semgrep.dev/docs/getting-started/cli-oss

**Installation:**
```bash
# Python (inside your project venv)
pip install semgrep

# Or via Homebrew
brew install semgrep
```

**Running scans:**
```bash
# Scan with the default ruleset (good starting point — covers security, correctness, and performance)
semgrep scan --config "p/default" .

# Scan with OWASP Top 10 rules specifically
semgrep scan --config "p/owasp-top-ten" .

# Scan with a broader security audit ruleset
semgrep scan --config "p/security-audit" .

# Combine multiple rulesets
semgrep scan --config "p/default" --config "p/owasp-top-ten" .

# Scan a specific file or directory
semgrep scan --config "p/default" src/
```

**Recommended rulesets:**
- `p/default` — general security, correctness, and performance rules. Start here.
- `p/owasp-top-ten` — rules mapped to the OWASP Top 10 categories.
- `p/security-audit` — broader security-focused rules for deeper analysis.
- `p/python` / `p/javascript` / `p/typescript` / `p/react` — language-specific rules.

**Integration into the development loop:**
- Run `semgrep scan --config "p/default" .` before every commit. Treat findings as blockers — fix them before pushing.
- If using Kiro, ask it to run semgrep after generating or modifying code and to address any findings.
- For CI/CD, add semgrep as a pipeline step that fails the build on high-severity findings.
- Semgrep findings include explanations and fix suggestions — read them. They're educational, especially for participants new to security.

**Custom rules:**
Semgrep rules are YAML-based and easy to write. If you identify a pattern specific to your project that should be flagged (e.g., a deprecated internal API, an unsafe configuration pattern), write a custom rule and add it to a `.semgrep/` directory in your project root:
```bash
# Scan with your custom rules
semgrep scan --config .semgrep/ .
```

Reference for writing rules: https://semgrep.dev/docs/writing-rules/overview

### Practical Security Checklist

Before considering any application "done," verify:

- [ ] No hardcoded secrets, credentials, or API keys in source code
- [ ] All user input is validated and sanitized
- [ ] Authentication and authorization are enforced server-side
- [ ] Sensitive data is encrypted in transit and at rest
- [ ] Dependencies are pinned, audited, and up to date
- [ ] Error messages don't leak internal details
- [ ] Security-relevant events are logged (without logging sensitive data)
- [ ] HTTPS is enforced for all endpoints
- [ ] CORS is configured restrictively (not `*`)
- [ ] Environment variables are used for all secrets and config

---

## Dependency & Supply Chain Management

This is not theoretical. In March 2026, the Trivy vulnerability scanner — a tool used *to secure* supply chains — was itself compromised in a supply chain attack (CVE-2026-33634). The attacker (TeamPCP) stole a GitHub Actions token from Aqua Security, injected credential-stealing malware into official Trivy releases and GitHub Actions, and the compromise cascaded downstream into Checkmarx KICS, LiteLLM (a Python library with tens of millions of monthly downloads), and over 66 npm packages. The attack succeeded because version tags were mutable and could be force-pushed. CISA added it to the Known Exploited Vulnerabilities catalog. This is the threat model we are building against.

References:
- https://www.stepsecurity.io/blog/trivy-compromised-a-second-time---malicious-v0-69-4-release
- https://www.darkreading.com/application-security/trivy-supply-chain-attack-targets-ci-cd-secrets
- https://www.cisa.gov/known-exploited-vulnerabilities

### Rule 1: Pin Dependencies by Hash, Not Version

Version tags and version numbers are mutable. They can be overwritten, force-pushed, or hijacked — as the Trivy attack demonstrated. Pin dependencies using content hashes (digests) whenever the ecosystem supports it.

**npm / Node.js:**
- `package-lock.json` already includes `integrity` hashes (SHA-512). Always commit the lock file and use `npm ci` (not `npm install`) in CI/CD to enforce exact resolution.
- For GitHub Actions, pin by commit SHA, not tag:
  ```yaml
  # BAD — tag can be force-pushed to point at malicious code
  - uses: actions/checkout@v4

  # GOOD — immutable commit hash
  - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
  ```

**Python:**
- Use `pip install --require-hashes` with a requirements file that includes hashes:
  ```
  flask==3.0.0 --hash=sha256:abc123...
  ```
- Generate hashed requirements with `pip-compile --generate-hashes` (from `pip-tools`).

**Docker:**
- Pull images by digest, not tag:
  ```
  # BAD
  FROM python:3.12-slim

  # GOOD
  FROM python:3.12-slim@sha256:abc123def456...
  ```

### Rule 2: Minimize Dependencies

Every dependency is an attack surface. The Trivy/LiteLLM chain reaction proved that a single compromised package can cascade across ecosystems.

- Before adding a dependency, ask: "Can I write this in 50 lines or less?" If yes, write it yourself in a local utility module.
- Prefer standard library functions over third-party packages for common tasks (date formatting, string manipulation, file I/O, HTTP requests in Python's `urllib`).
- Audit your dependency tree. Remove anything unused. Run `npm prune` or review `pip list` regularly.
- When you do need a dependency, prefer well-maintained packages with: active maintainers, a security policy, frequent releases, and a large user base.
- Every new dependency added to a project must be explicitly announced in the PR/commit message with a justification for why it's needed.

### Rule 3: Enumerate and Audit Against Known Exploits

Cross-reference your dependencies against known vulnerability databases, especially the CISA Known Exploited Vulnerabilities (KEV) catalog.

- **CISA KEV Catalog:** https://www.cisa.gov/known-exploited-vulnerabilities — this is the authoritative list of vulnerabilities confirmed to be actively exploited in the wild. If a dependency appears here, remediation is urgent and non-negotiable.
- Run `npm audit` (Node.js) or `pip-audit` (Python) as part of every build.
- For broader CVE coverage, use `grype` (see SBOM section below) to scan against NVD, GitHub Advisory Database, and distribution-specific feeds.
- Make dependency auditing a regular practice, not a one-time event. Check weekly at minimum.

### Rule 4: Announce Every Dependency

When any dependency is added, updated, or removed, it must be explicitly called out:

- In the commit message, list the dependency name, version, and why it was added/changed.
- In pull requests, include a "Dependencies Changed" section if any packages were added or updated.
- If Kiro or any AI tool adds a dependency during code generation, review it before accepting. Verify the package exists, is legitimate, and is necessary.
- This creates an auditable trail and prevents silent dependency creep.

### Rule 5: Generate a Software Bill of Materials (SBOM)

Use open source tooling to produce and maintain an SBOM for every project. An SBOM is a complete inventory of all components, libraries, and dependencies in your software — it's how you answer "are we affected?" when the next supply chain incident drops.

**Recommended tools (Anchore open source suite):**

- **Syft** — generates SBOMs from source code, container images, and filesystems. Outputs in SPDX and CycloneDX formats.
  ```bash
  # Install
  curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin

  # Generate SBOM from project directory
  syft dir:. -o spdx-json > sbom.spdx.json

  # Generate SBOM from container image
  syft myapp:latest -o cyclonedx-json > sbom.cdx.json
  ```

- **Grype** — scans SBOMs (or source/images directly) for known vulnerabilities. Cross-references NVD, GitHub Advisories, and OS-specific feeds.
  ```bash
  # Install
  curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin

  # Scan an SBOM
  grype sbom:sbom.spdx.json

  # Scan a project directory directly
  grype dir:.

  # Scan a container image
  grype myapp:latest
  ```

- Reference: https://github.com/anchore/syft and https://github.com/anchore/grype

**SBOM practices:**
- Generate an SBOM for every release or deployment.
- Store SBOMs alongside build artifacts.
- Run `grype` against the SBOM as part of CI/CD. Fail the build on critical/high severity findings.
- When a new CVE drops (especially one on the CISA KEV), re-scan your SBOMs to determine exposure immediately.

### Supply Chain Checklist

- [ ] All dependencies pinned by hash/digest (not just version number)
- [ ] GitHub Actions pinned by commit SHA
- [ ] Docker base images pinned by digest
- [ ] `npm ci` used in CI/CD (not `npm install`)
- [ ] `pip install --require-hashes` used for Python deployments
- [ ] Dependency audit (`npm audit`, `pip-audit`, or `grype`) runs on every build
- [ ] SBOM generated for every release (Syft)
- [ ] SBOM scanned for vulnerabilities (Grype)
- [ ] New dependencies explicitly justified and announced in commits/PRs
- [ ] Dependencies cross-referenced against CISA KEV for active exploits
- [ ] Unused dependencies removed

---

## General Architecture Guidance

- Start simple. Monolith-first is fine — don't prematurely decompose into microservices.
- Separate concerns clearly: API layer, business logic, data access. Don't let HTTP handlers contain database queries.
- Design APIs contract-first when possible. Define the interface before the implementation.
- Use environment-based configuration for anything that changes between environments (URLs, credentials, feature flags).
- Prefer managed services over self-hosted infrastructure when deploying to AWS.
