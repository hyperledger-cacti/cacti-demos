# Cacti Demos Release Notes

This document tracks cacti-demos version updates.

- Repository: [hyperledger-cacti/cacti-demos](https://github.com/hyperledger-cacti/cacti-demos)
- Open issues: [Issue tracker](https://github.com/hyperledger-cacti/cacti-demos/issues)
- Pull requests: [PRs](https://github.com/hyperledger-cacti/cacti-demos/pulls)
- Releases: [Release page](https://github.com/hyperledger-cacti/cacti-demos/releases)

## Cacti Demos v1.0.0

> Previous release: [0.0.1](https://github.com/hyperledger-cacti/cacti-demos/releases/tag/0.0.1) (commit [`fe8bdfe5`](https://github.com/hyperledger-cacti/cacti-demos/commit/fe8bdfe55edb5b18c253a528c0b799a8aaf10f22))
>
> Full diff: [`0.0.1...1.0.0`](https://github.com/hyperledger-cacti/cacti-demos/compare/0.0.1...1.0.0)

### Key highlights

- **Major repository expansion**: Migrated core examples and test packages from `hyperledger-cacti/cacti` into `cacti-demos`, including CBDC bridging backend/frontend, workshop examples, carbon-accounting packages, and multiple test packages ([`a5b823d`](https://github.com/hyperledger-cacti/cacti-demos/commit/a5b823d), [`9542577`](https://github.com/hyperledger-cacti/cacti-demos/commit/9542577), [`bd2fa18`](https://github.com/hyperledger-cacti/cacti-demos/commit/bd2fa18), [`8089ba0`](https://github.com/hyperledger-cacti/cacti-demos/commit/8089ba0), [`80b0bae`](https://github.com/hyperledger-cacti/cacti-demos/commit/80b0bae), [`ec5f56c`](https://github.com/hyperledger-cacti/cacti-demos/commit/ec5f56c)).
- **CI and developer workflow hardening**: Added global build/lint pipelines and pre-commit build/lint execution via Husky, plus workflow dependency updates and compatibility fixes ([`4f5362b`](https://github.com/hyperledger-cacti/cacti-demos/commit/4f5362b), [`94341a5`](https://github.com/hyperledger-cacti/cacti-demos/commit/94341a5), [`a76a6a7`](https://github.com/hyperledger-cacti/cacti-demos/commit/a76a6a7)).
- **SATP demo documentation upgrades**: Added and refined SATP demos including cross-chain NFT transfer and three-chain examples, plus adapter demo migration docs ([`890fd92`](https://github.com/hyperledger-cacti/cacti-demos/commit/890fd92), [`8350d8e`](https://github.com/hyperledger-cacti/cacti-demos/commit/8350d8e), [`aab2611`](https://github.com/hyperledger-cacti/cacti-demos/commit/aab2611), [`bd448a9`](https://github.com/hyperledger-cacti/cacti-demos/commit/bd448a9)).
- **Repository structure consolidation**: Reorganized project layout to align with issue guidelines and support the migrated package footprint ([`4781101`](https://github.com/hyperledger-cacti/cacti-demos/commit/4781101)).

## What's Changed

### Features

- feat(ci): embed full build and lint pipeline into husky pre-commit hooks by Parth Singh ([`94341a5`](https://github.com/hyperledger-cacti/cacti-demos/commit/94341a5))
- feat(ci): add global build and lint pipelines by ParthSingh ([`4f5362b`](https://github.com/hyperledger-cacti/cacti-demos/commit/4f5362b))
- feat: migrate cactus-workshop-examples package by ParthSingh ([`80b0bae`](https://github.com/hyperledger-cacti/cacti-demos/commit/80b0bae))
- feat: migrate carbon-accounting packages by ParthSingh ([`8089ba0`](https://github.com/hyperledger-cacti/cacti-demos/commit/8089ba0))
- feat: migrate cactus-example-cbdc-bridging documentation by ParthSingh ([`b9f6663`](https://github.com/hyperledger-cacti/cacti-demos/commit/b9f6663))
- feat: migrate cactus-example-cbdc-bridging-frontend by ParthSingh ([`bd2fa18`](https://github.com/hyperledger-cacti/cacti-demos/commit/bd2fa18))
- feat: migrate cactus-example-cbdc-bridging-backend by ParthSingh ([`9542577`](https://github.com/hyperledger-cacti/cacti-demos/commit/9542577))
- feat: migrate cactus-common-example-server by ParthSingh ([`a5b823d`](https://github.com/hyperledger-cacti/cacti-demos/commit/a5b823d))

### Bug Fixes

- fix: restore compatible dependency versions for CI build by copilot-swe-agent[bot] ([`a76a6a7`](https://github.com/hyperledger-cacti/cacti-demos/commit/a76a6a7))

### Documentation

- docs(examples): add minimal cacti-starter onboarding template by Parth Singh ([`593206a`](https://github.com/hyperledger-cacti/cacti-demos/commit/593206a))
- docs(satp-hermes): migrate adapter demos from main repository by ParthSingh ([`bd448a9`](https://github.com/hyperledger-cacti/cacti-demos/commit/bd448a9))
- docs: update case 6 documentation by AtharvaKathe18 ([`a8803c5`](https://github.com/hyperledger-cacti/cacti-demos/commit/a8803c5))
- docs(satp-hermes): add example using 3 chains by Rafael Belchior ([`aab2611`](https://github.com/hyperledger-cacti/cacti-demos/commit/aab2611))
- docs(satp-hermes): add example using 3 chains by Tomas Silva ([`8350d8e`](https://github.com/hyperledger-cacti/cacti-demos/commit/8350d8e))
- docs(satp-hermes): add example for cross-chain transfers of nfts by Tomas Silva ([`890fd92`](https://github.com/hyperledger-cacti/cacti-demos/commit/890fd92))

### Refactors

- refactor: reorganize repo structure per issue guidelines ([`4781101`](https://github.com/hyperledger-cacti/cacti-demos/commit/4781101))
- refactor: migrate cactus-test-tooling from cacti to cacti-demos ([`ec5f56c`](https://github.com/hyperledger-cacti/cacti-demos/commit/ec5f56c))
- refactor: copy cactus-test-plugin-htlc-eth-besu ([`56dc15c`](https://github.com/hyperledger-cacti/cacti-demos/commit/56dc15c))
- refactor: copy cactus-test-api-client ([`a93a48e`](https://github.com/hyperledger-cacti/cacti-demos/commit/a93a48e))
- refactor: copy cactus-test-cmd-api-server from cacti to cacti-demos ([`dbcce63`](https://github.com/hyperledger-cacti/cacti-demos/commit/dbcce63))
- refactor: copy cactus-test-geth-ledger from cacti to cacti-demos ([`fd0f1a7`](https://github.com/hyperledger-cacti/cacti-demos/commit/fd0f1a7))
- refactor: copy cacti-copm-test ([`2d5b6e3`](https://github.com/hyperledger-cacti/cacti-demos/commit/2d5b6e3))
- refactor: copy cactus-test-plugin-ledger-connector-ethereum ([`bb28783`](https://github.com/hyperledger-cacti/cacti-demos/commit/bb28783))
- refactor: copy test-plugin-htlc-eth-besu-erc20 ([`75425dd`](https://github.com/hyperledger-cacti/cacti-demos/commit/75425dd))
- refactor: copy test-plugin-ledger-connector-besu ([`1784c96`](https://github.com/hyperledger-cacti/cacti-demos/commit/1784c96))

### Chores / Maintenance

- chore(deps): bump the npm group across 1 directory with 63 updates ([`b976162`](https://github.com/hyperledger-cacti/cacti-demos/commit/b976162))
- chore(deps): bump actions/checkout from 4 to 7 ([`b71af99`](https://github.com/hyperledger-cacti/cacti-demos/commit/b71af99))
- chore(deps): bump actions/setup-python from 5 to 7 in /.github/workflows ([`c16717f`](https://github.com/hyperledger-cacti/cacti-demos/commit/c16717f))
- chore(deps): bump the npm group across 1 directory with 61 updates ([`52cee20`](https://github.com/hyperledger-cacti/cacti-demos/commit/52cee20))
- chore(deps): bump softprops/action-gh-release from 2 to 3 ([`43c3095`](https://github.com/hyperledger-cacti/cacti-demos/commit/43c3095))
- chore(deps): bump softprops/action-gh-release in /.github/workflows ([`6e606e6`](https://github.com/hyperledger-cacti/cacti-demos/commit/6e606e6))
- chore(deps): bump github/codeql-action from 3 to 4 in /.github/workflows ([`149c46e`](https://github.com/hyperledger-cacti/cacti-demos/commit/149c46e))
- chore(deps): bump github/codeql-action from 3 to 4 ([`36d54c8`](https://github.com/hyperledger-cacti/cacti-demos/commit/36d54c8))
- chore(deps): bump the npm group across 1 directory with 32 updates ([`1cbfa8e`](https://github.com/hyperledger-cacti/cacti-demos/commit/1cbfa8e))

## Release Summary

| Metric | Value |
|--------|-------|
| Tag | `1.0.0` |
| Previous tag | [`0.0.1`](https://github.com/hyperledger-cacti/cacti-demos/releases/tag/0.0.1) |
| Date range | 2025-11-12 (0.0.1) - 2026-08-03 |
| Total commits | 35 |
| Non-merge commits | 34 |
| Files changed | 582 |
| Lines added | +142,616 |
| Lines removed | -450 |
| Referenced PR/issue IDs | 16 |
| Contributors (author identities) | 7 |
| Unique contributor emails | 6 |

### Contributions by type

| Category | Count |
|----------|------:|
| Features | 8 |
| Bug Fixes | 1 |
| Documentation | 6 |
| Refactors | 10 |
| Chores / CI / Dependency updates | 9 |
| Merge commits | 1 |

## Contributors

- Parth Singh
- Rafael Belchior
- Tomas Silva
- AtharvaKathe18
