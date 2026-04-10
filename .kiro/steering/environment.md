---
inclusion: always
---

# Environment & Tooling Standards

## Python

- **Always use virtual environments.** Never install project dependencies globally.
- Create a venv at the project root: `python3 -m venv .venv`
- Activate before installing anything: `source .venv/bin/activate`
- Pin dependencies: use `requirements.txt` with exact versions or `pip freeze > requirements.txt`
- Add `.venv/` to `.gitignore`. Never commit the virtual environment.
- Use `python3` explicitly (not `python`) to avoid ambiguity on systems with Python 2 still present.
- For new projects, prefer Python 3.11+ unless there's a specific compatibility constraint.

## Node.js

- **Use nvm (Node Version Manager)** to manage Node.js versions.
- Every project should include an `.nvmrc` file specifying the required Node version.
- Run `nvm use` when entering a project directory to ensure the correct version is active.
- Use `npm` as the default package manager unless the project already uses `yarn` or `pnpm`.
- Always commit `package-lock.json` (or `yarn.lock`). Never delete and regenerate lock files casually.
- Use LTS versions of Node.js unless a specific feature requires a newer release.

## General Environment Practices

- **Keep environments isolated.** Each project should be self-contained with its own dependencies. No cross-project dependency sharing.
- **Use `.env` files** for local configuration. Never commit `.env` files — add them to `.gitignore` and provide a `.env.example` with placeholder values.
- **Use `.gitignore` properly.** At minimum, ignore:
  - `.venv/`, `node_modules/`, `.env`, `dist/`, `build/`, `__pycache__/`, `.DS_Store`
- **Use consistent editor settings.** Include an `.editorconfig` file in every project for consistent indentation, line endings, and trailing whitespace handling.
- **Document setup steps.** Every project README should include a "Getting Started" section with exact commands to set up the environment from scratch.

## Version Control

- Use Git for all projects.
- Commit early and often. Small, focused commits with clear messages.
- Use conventional commit messages when possible: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Don't commit generated files, build artifacts, or secrets.
- Use branches for features and fixes. Keep `main` clean and deployable.

## Shell & Scripts

- Use `bash` for shell scripts. Include `#!/usr/bin/env bash` as the shebang line.
- Make scripts executable: `chmod +x script.sh`
- Prefer scripts over manual multi-step processes. If you do it more than twice, script it.
