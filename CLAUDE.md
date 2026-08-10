# React Insight

## Project Context

React Insight is an open-source, TypeScript-first toolkit for debugging,
inspecting, and understanding React applications at runtime.

The `.ai/` directory contains the project's engineering context and
documentation.

## Source of Truth

The actual source code is the primary source of truth.

When documentation conflicts with implementation:

1. Inspect the current source code.
2. Inspect relevant tests.
3. Inspect Git history when useful.
4. Identify the discrepancy.
5. Update the affected `.ai/` documentation when appropriate.

Never change working code only to match outdated documentation.

## Documentation

The project documentation is stored in:

- `.ai/PROJECT_CONTEXT.md`
- `.ai/ARCHITECTURE.md`
- `.ai/REACT_ARCHITECTURE.md`
- `.ai/REACT_RUNTIME_ARCHITECTURE.md`
- `.ai/DECISIONS.md`
- `.ai/ROADMAP.md`
- `.ai/SESSION_LOG.md`

Do not update every documentation file after every change.

Update only the documents affected by the actual implementation changes.

## Documentation Timing

Synchronize documentation immediately when:

- Public APIs change
- Architecture changes
- Package boundaries change
- Major subsystems are added or removed
- Runtime lifecycle changes
- Important architectural decisions change
- Roadmap or project direction changes

For smaller changes, documentation can be synchronized after a meaningful
feature or milestone rather than after every commit.

## Engineering Rules

- Use pnpm.
- Preserve TypeScript strictness.
- Preserve public APIs whenever possible.
- Keep changes small and focused.
- Avoid unrelated refactoring.
- Avoid unnecessary dependencies.
- Avoid speculative abstractions.
- Preserve package boundaries.
- Consider runtime performance and memory usage.
- Add regression tests for bug fixes when appropriate.

## Verification

For meaningful changes, run the relevant:

- Tests
- Type checks
- Lint
- Build

Never claim verification succeeded unless it was actually executed.

## Final Documentation Check

Before completing a meaningful task:

1. Review the implementation.
2. Review relevant tests.
3. Determine whether `.ai/` documentation is affected.
4. Update only affected documents.
5. Verify that documentation matches the final implementation.
6. Record meaningful milestones in `.ai/SESSION_LOG.md`.
