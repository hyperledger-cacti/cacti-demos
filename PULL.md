# Pull Request Guidelines

This document defines the quality standards every pull request must meet before a maintainer will review it.

## 1. One Logical Unit of Work

A pull request must change one logical concern. A bug fix, a new feature, a refactoring, and a documentation update are each separate concerns and must not be bundled together.

## 2. Small and Simple

Keep diffs as small and as simple as possible.

- If a feature is large, break it into a series of incremental PRs.
- PRs that span many dozens of files or hundreds of lines across unrelated concerns will be closed; the contributor will be asked to decompose them before re-opening.

## 3. Commit Type and Title Discipline

Use Conventional Commit types based on user impact, not file location.

- Use `fix:` only for user-facing bug fixes.
- Use `feat:` only for user-facing features.
- Use `build:` only for build-system/package build changes.
- For non-user-facing work, use appropriate types such as `docs:`, `test:`, `ci:`, `chore:`, `refactor:`.

## 4. Signed commits

Have git sign-off at the end of the commit message (`Signed-off-by: Name <email>`) to certify the Developer Certificate of Origin (DCO). Use the `-s` flag with `git commit`.
