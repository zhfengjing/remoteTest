# Repository Guidelines

## Project Structure & Module Organization
This repository is currently minimal and contains only `README.md` at the root. As code is added, keep source files grouped by language or responsibility and avoid scattering single files across the root. Prefer a clear top-level layout such as `src/` for application code, `tests/` for automated tests, and `docs/` for supporting documentation. If assets are introduced, place them in an `assets/` or `public/` directory and keep binary files out of the root.

## Build, Test, and Development Commands
No build, test, or local development commands are defined yet. If you add a toolchain, document the exact commands in `README.md` and mirror them here. Examples of expected entries:
- `npm run build` for production builds
- `npm test` for the full test suite
- `npm run dev` for local development

## Coding Style & Naming Conventions
There is no enforced style configuration in the repository. When adding code, use a consistent 2- or 4-space indentation per language, prefer descriptive names (`snake_case` for scripts, `camelCase` for variables, `PascalCase` for types/classes), and keep files named after their primary purpose. If you introduce formatters or linters (e.g., `prettier`, `eslint`, `ruff`), add their configs at the root and document how to run them.

## Testing Guidelines
No testing framework is configured yet. If you add tests, colocate them under `tests/` or next to the code they validate, and use clear naming like `thing.test.js` or `test_thing.py`. Aim for tests that cover core behavior and edge cases. Document the command to run tests and any required environment variables.

## Commit & Pull Request Guidelines
Git history currently contains a single commit: `Initial commit`. Until a convention is established, use short, imperative commit messages (e.g., "Add input validation"). For pull requests, include a concise description of changes, link any related issues, and add screenshots or logs for user-facing updates.

## Security & Configuration Tips
Do not commit secrets or private keys. Store configuration in environment variables or `.env` files and add secrets to `.gitignore`.
