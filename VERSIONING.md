# Versioning

This document describes how versions are managed and released for `@adobe/premierepro`.

## Version scheme

Package versions mirror Premiere Pro's release schedule:

| Version format | Example | Meaning |
|---|---|---|
| `X.Y.0-beta.N` | `26.3.0-beta.15` | Beta release tracking Premiere 26.3.0 Beta, build 15 |
| `X.Y.0` | `26.3.0` | Stable release aligned with Premiere 26.3.0 |
| `X.Y.Z` (Z > 0) | `26.3.1` | Backport patch to the 26.3 stable line |

The beta prerelease number (`N`) ideally corresponds to Premiere's internal Beta build number, but may not always align exactly — it can be set explicitly or auto-incremented.

## npm distribution tags

| Tag | Points to |
|---|---|
| `@latest` | Most recent stable release |
| `@beta` | Most recent beta release |
| `@release-X.Y` | Most recent patch on the `X.Y` stable line (e.g. `@release-26.3`) |

## Branch structure

| Branch | Purpose |
|---|---|
| `main` | Active development. Always tracks the current beta version (e.g. `26.3.0-beta.N`). |
| `release/X.Y` | Stable line for `X.Y`. Created automatically when `X.Y.0` is released. Receives backport patches only. |
| `release-prep/*` | Short-lived branches opened by workflows. Merged via PR, then deleted. |

## Workflows

All releases go through a two-step process: **prepare** (creates a PR) then **publish** (runs automatically when the PR is merged). No workflow ever pushes directly to `main` or `release/*`.

### `prepare-release` — creates the release PR

Triggered manually via **Actions → Prepare Release → Run workflow**.

| Input | Required | Description |
|---|---|---|
| `type` | Yes | `beta`, `stable`, or `backport` |
| `build_number` | No (beta only) | Explicit prerelease number. Auto-increments from the current version if not provided. |
| `next_cycle` | No (stable only) | Base version for the next beta cycle (e.g. `26.4.0` or `27.0.0` for a major bump). Auto-increments minor if not provided. **Must be set explicitly for major version bumps.** |

The workflow:
1. Computes the next version
2. Updates `package.json`, `package-lock.json`, and `CHANGELOG.md`
3. Opens a PR titled `chore: release X.Y.Z-beta.N` (or `chore: release X.Y.Z`)

> **For backport releases**, run this workflow from the appropriate `release/X.Y` branch using the branch dropdown in the Actions UI.

### `publish` — publishes to npm after PR merge

Triggered automatically on every push to `main` or `release/**`. Only proceeds if the merged commit message starts with `chore: release ` — all other pushes (regular PRs, the next-cycle bump PR) are silently skipped.

When a release commit is detected, the workflow:
1. Runs tests
2. Creates and pushes a git tag (`vX.Y.Z`)
3. Publishes to npm with the appropriate dist-tag
4. Creates a GitHub release

For **stable** releases it additionally:
- Creates the `release/X.Y` branch for future backports
- Opens a follow-up PR to bump `main` to the next beta cycle (`chore: begin X.Y.0-beta.0 cycle`)

---

## Scenario: publishing a beta release

**Starting state:** `main` is at `26.3.0-beta.5`. Premiere 26.3.0 Beta Build 20 shipped with a new API, and you've merged a PR with `feat: add Timeline.createSequenceFromPreset()` to `main`.

1. Go to **Actions → Prepare Release → Run workflow** (on `main`)
2. Set **type** = `beta`. Optionally set **build_number** = `20` to align with the Premiere build; otherwise leave it blank to auto-increment to `26.3.0-beta.6`.
3. The workflow creates branch `release-prep/26.3.0-beta.20` and opens a PR:
   - `package.json` version: `26.3.0-beta.20`
   - `CHANGELOG.md`: new `## 26.3.0-beta.20` section with a "Beta release." entry
4. Review the PR — confirm the version and that only `package.json`, `package-lock.json`, and `CHANGELOG.md` changed.
5. Merge the PR.
6. The `publish` workflow detects `chore: release 26.3.0-beta.20`, runs tests, pushes tag `v26.3.0-beta.20`, and publishes to npm as `@beta`.
7. A GitHub pre-release `v26.3.0-beta.20` is created.

Dependents can now install `@adobe/premierepro@beta` or pin to `@adobe/premierepro@26.3.0-beta.20`.

---

## Scenario: cutting a stable release

**Starting state:** Premiere 26.3.0 has shipped. `main` is at `26.3.0-beta.20`.

1. Go to **Actions → Prepare Release → Run workflow** (on `main`)
2. Set **type** = `stable`. Optionally set **next_cycle** = `26.4.0` (or leave blank to auto-increment).
3. The workflow creates branch `release-prep/26.3.0` and opens a PR:
   - `package.json` version: `26.3.0`
   - `CHANGELOG.md`: full generated entry with all `feat:` and `fix:` commits since the last stable tag (`v26.2.0`)
   - Commit message includes `Next-Cycle: 26.4.0` trailer (read by the publish workflow)
4. Review the PR — check the CHANGELOG accurately reflects what's in this release.
5. Merge the PR.
6. The `publish` workflow detects `chore: release 26.3.0` (no `-beta` suffix, on `main` → stable):
   - Runs tests
   - Pushes tag `v26.3.0`
   - Publishes to npm as `@latest`
   - Creates GitHub release `v26.3.0`
   - Creates branch `release/26.3` for future backports
   - Opens a second PR: `chore: begin 26.4.0-beta.0 cycle`
7. Review and merge the second PR. `main` is now at `26.4.0-beta.0`, ready for the next cycle.

> The second PR's commit message (`chore: begin 26.4.0-beta.0 cycle`) does **not** match the `chore: release ` pattern, so the `publish` workflow skips it — no accidental publish.

---

## Scenario: backport patch release

**Starting state:** `release/26.3` is at `26.3.0`. A type definition bug was found and fixed on the `release/26.3` branch.

1. Go to **Actions → Prepare Release → Run workflow**
2. **Change the branch** (in the Run workflow dropdown) to `release/26.3`
3. Set **type** = `backport`. Leave all other inputs blank.
4. The workflow creates branch `release-prep/26.3.1` and opens a PR targeting `release/26.3`:
   - `package.json` version: `26.3.1`
   - `CHANGELOG.md`: generated entry from commits since `v26.3.0` (excluding chore/build/ci)
5. Review and merge the PR into `release/26.3`.
6. The `publish` workflow detects `chore: release 26.3.1` on `release/26.3` → type=backport:
   - Publishes to npm as `@release-26.3` (does **not** update `@latest`)
   - Creates GitHub release `v26.3.1`

Users on the 26.3 stable line can install with `npm install @adobe/premierepro@release-26.3` or by exact version.

---

## Major version bumps

When Premiere increments its major version (e.g. 26.x → 27.x), the process is identical to a stable release except you **must** provide `next_cycle` explicitly when running `prepare-release`:

- **next_cycle** = `27.0.0`

The auto-increment fallback only increments the minor version and cannot know when a major bump is intended. If left blank during a major version transition it will produce `26.11.0` instead of `27.0.0`.

---

## CHANGELOG policy

- **Beta releases** receive a minimal placeholder entry (`Beta release.`). The full commit history is intentionally omitted to avoid churn for API consumers — the stable release entry is the authoritative record.
- **Stable releases** receive a generated entry grouping all `feat:` and `fix:` commits since the previous stable tag.
- **Backport releases** receive a generated entry from non-chore commits since the previous tag on the release branch.
