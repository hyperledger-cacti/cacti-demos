# Contributing to Cacti Demos

Thank you for your interest in contributing!

## PR Checklist - Contributor/Developer

1. Fork the repository via the Github UI.
2. Clone the fork to your local machine.
3. Make sure you have set up your git signatures and always sign your commits using `git commit -s`.
4. Ensure your commit message follows the [Conventional Commits syntax](https://www.conventionalcommits.org/en/v1.0.0/).
5. Be aware that we use Husky git commit hooks for the automation of formatting and linting. Your code will be automatically checked for `eslint` and `cspell` compliance before the commit is allowed.
6. Ensure your branch is rebased onto the `main` branch before submitting.
7. If merge conflicts arise, you must fix these at rebase time.
8. Ideally there should be just one commit in each pull request. We ask that you try to avoid submitting PRs with dozens of commits. If necessary, squash your commits via interactive rebase before pushing.

## Git Workflow Requirements

- **No Merge Commits:** We follow a no-merge policy. When bringing the latest changes from the main branch to your feature branch, always use `git rebase main` instead of `git merge main`.
- **DCO Enforcement:** Every single commit must have a `Signed-off-by: Your Name <email>` footer.
- **Commit Linting:** Commits that do not start with a valid conventional prefix (e.g., `feat:`, `chore:`, `fix:`) will be rejected by the local Husky hooks.
