# Versioning

This document describes how versions are managed and released for `@adobe/premierepro`.

## Table of Contents

- [Quick Reference: What Release Should I Cut?](#quick-reference-what-release-should-i-cut)
- [Version scheme](#version-scheme)
- [npm distribution tags](#npm-distribution-tags)
- [Branch structure](#branch-structure)
- [Workflows](#workflows)
  - [`prepare-release` — creates the release PR](#prepare-release--creates-the-release-pr)
  - [`publish` — publishes to npm after PR merge](#publish--publishes-to-npm-after-pr-merge)
- [When to Release](#when-to-release)
- [Scenarios](#scenarios)
  - [Publishing a beta release](#scenario-publishing-a-beta-release)
  - [Cutting a stable release](#scenario-cutting-a-stable-release)
  - [Backport patch release](#scenario-backport-patch-release)
- [Major version bumps](#major-version-bumps)
- [CHANGELOG policy](#changelog-policy)

## Quick Reference: What Release Should I Cut?

Use this decision tree to determine which release type to initiate:

```
Have you merged a new feature or fix to main?
├─ YES: Is Premiere shipping a new stable version soon?
│   ├─ YES: Cut a STABLE release
│   └─ NO: Cut a BETA release
└─ NO: Is there a critical bug in an already-released stable version?
    ├─ YES: Cut a BACKPORT patch
    └─ NO: No release needed
```

**Troubleshooting:**
- Not sure if Premiere shipped a new version? Check the [Premiere Pro release notes](https://adobe.com).
- Need help deciding? Ask your tech lead or check recent issues/PRs.
- Accidentally started the wrong release? Close the PR and start over — no harm done until you merge.

## Version scheme

Package versions attempt to mirror Premiere Pro's release schedule where possible:

| Version format | Example | Meaning |
|---|---|---|
| `X.Y.0-beta.N` | `26.3.0-beta.15` | Beta release tracking Premiere 26.3.0 Beta, build 15 |
| `X.Y.0` | `26.3.0` | Stable release aligned with Premiere 26.3.0 |
| `X.Y.Z` (Z > 0) | `26.3.1` | Backport patch to the 26.3 stable line |

The beta prerelease number (`N`) ideally corresponds to Premiere's Beta build number, but may not always align exactly — it can be set explicitly or incremented by 1 from the previous beta. We also do not release new APIs with every Beta build so prerelease numbers may skip.

## npm distribution tags

| Tag | Points to | Use Case |
|---|---|---|
| `@latest` | Most recent stable release | Production use. Most users should install this. |
| `@beta` | Most recent beta release | Early testing of upcoming APIs before they're officially released. |
| `@release-X.Y` | Most recent patch on the `X.Y` stable line (e.g. `@release-26.3`) | Staying on a specific minor version line when you can't upgrade to the latest. |

**Examples:**
- `npm install -D @adobe/premierepro@latest` → Install the most stable version
- `npm install -D @adobe/premierepro@beta` → Install the latest beta for early testing
- `npm install -D @adobe/premierepro@release-26.3` → Stick to the 26.3 line even if 26.4+ is available

## Branch structure

| Branch | Purpose |
|---|---|
| `main` | Active development. Always tracks the current beta version (e.g. `26.3.0-beta.N`). New features and fixes go here. |
| `release/X.Y` | Stable line for `X.Y`. Created automatically when `X.Y.0` is released. Receives backport patches only (no new features). |
| `release-prep/*` | **Temporary branches created automatically by the prepare-release workflow.** They hold release commits (version bump, CHANGELOG updates) and are deleted after the PR is merged. You'll see these in PRs but never work from them directly. |

## Workflows

All releases go through a two-step process: **prepare** (creates a PR) then **publish** (runs automatically when the PR is merged). No workflow ever pushes directly to `main` or `release/*`.

> **Repository requirement:** `main` and `release/**` must be configured to use **"Pull request title and description"** as the squash commit message (Settings → General → Pull Requests → "Allow squash merging" → Default commit message). This ensures the squash commit on `main` includes the PR body — which carries the `Next-Cycle:` trailer that `detect-release` reads for stable releases, and the full list of changes for audit purposes.

### `prepare-release` — creates the release PR

Triggered manually via **Actions → Prepare Release → Run workflow**.

| Input | Required | Description |
|---|---|---|
| `type` | Yes | `beta`, `stable`, or `backport` |
| `build_number` | No (beta only) | Explicit prerelease number. If not provided, increments beta build number `N` by 1 from the current version (e.g. `26.3.0-beta.5` → `26.3.0-beta.6`). |
| `next_cycle` | No (stable only) | Base version for the next beta cycle. After releasing `26.3.0`, this should be `26.4.0` (or `27.0.0` for a major bump). If not provided, increments the minor version by 1 automatically. **Must be set explicitly for major version bumps.** Once set, `main` will be bumped to `next_cycle-beta.0` (e.g. `26.4.0-beta.0`). |

The workflow:
1. Computes the next version
2. Updates `package.json`, `package-lock.json`, and `CHANGELOG.md`
3. Opens a PR titled `chore: release X.Y.Z-beta.N` (or `chore: release X.Y.Z`) whose body includes the full CHANGELOG entry for this release (all `feat:` and `fix:` commits in scope). When the PR is squash-merged, this body becomes the commit message body on `main`, giving every release commit a built-in record of what it contains.

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

**Publish workflow decision tree:**

```
Commit message starts with "chore: release"?
├─ NO → Skip (silent, no-op)
└─ YES → Is this on main or release/**?
    ├─ On main:
    │   ├─ Contains "-beta"? → Publish as @beta
    │   └─ No "-beta"? → Publish as @latest, create release/* branch, open next-cycle PR
    └─ On release/**:
        └─ Publish as @release-X.Y (never updates @latest)
```

---

## When to Release

**Beta releases:** Cut a beta release whenever you've merged new features or fixes to `main` and want to make them available for testing. Typically aligned with Premiere's beta builds, but you decide the cadence.

**Stable releases:** Cut a stable release when:
- Premiere Pro ships a new stable version (required)
- The APIs in `main` match what shipped in that Premiere version
- You're ready for production use

**Backport releases:** Cut a backport patch when a critical bug is discovered in an already-released stable version and fixed on the `release/X.Y` branch.

---

## Scenarios

### Scenario: publishing a beta release

**Starting state:** `main` is at `26.3.0-beta.5`. Premiere 26.3.0 Beta Build 20 shipped with a new API, and you've merged a PR with `feat: add Timeline.createSequenceFromPreset()` to `main`.

1. Go to **Actions → Prepare Release → Run workflow** (on `main`)
2. Set **type** = `beta`. Optionally set **build_number** = `20` to align with the Premiere build; otherwise leave it blank and `N` will increment by 1 from the current version (`26.3.0-beta.5` → `26.3.0-beta.6`).
3. The workflow creates branch `release-prep/26.3.0-beta.20` and opens a PR:
   - `package.json` version: `26.3.0-beta.20`
   - `CHANGELOG.md`: new `## 26.3.0-beta.20` section with `feat:` and `fix:` commits since `v26.3.0-beta.5`
4. Review the PR — confirm the version and that only `package.json`, `package-lock.json`, and `CHANGELOG.md` changed.
5. Merge the PR.
6. The `publish` workflow detects `chore: release 26.3.0-beta.20`, runs tests, pushes tag `v26.3.0-beta.20`, and publishes to npm as `@beta`.
7. A GitHub pre-release `v26.3.0-beta.20` is created.

Dependents can now install `@adobe/premierepro@beta` or pin to `@adobe/premierepro@26.3.0-beta.20`.

---

## Scenario: cutting a stable release

**Starting state:** Premiere 26.3.0 has shipped. `main` is at `26.3.0-beta.20`.

1. Go to **Actions → Prepare Release → Run workflow** (on `main`)
2. Set **type** = `stable`. Optionally set **next_cycle** = `26.4.0` (or leave blank to increment the minor version by 1, e.g. `26.3.0` → `26.4.0`).
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

The default fallback only increments the minor version by 1 and cannot know when a major bump is intended. If left blank during a major version transition it move from `26.3.0` --> `26.4.0` instead of `27.0.0`.

---

## CHANGELOG policy

- **Beta releases** receive a generated entry with `feat:` and `fix:` commits since the previous tag (the last beta, or the last stable for the first beta of a cycle). Each beta entry shows only what's new in that specific beta.
- **Stable releases** receive a generated entry with all `feat:` and `fix:` commits since the previous stable tag — spanning the entire beta cycle. This is the authoritative cumulative record of what changed in the release.
- **Stable releases** receive a generated entry grouping all `feat:` and `fix:` commits since the previous stable tag.
- **Backport releases** receive a generated entry from non-chore commits since the previous tag on the release branch.

**Examples:**

```markdown
### Beta CHANGELOG entry:
## 26.3.0-beta.20
Beta release.

### Stable CHANGELOG entry:
## 26.3.0 (2026-04-24)
### Features
* add new API ...
* add new API ...
### Bug Fixes
* fix type error

### Backport CHANGELOG entry:
## 26.3.1 (2026-04-25)
### Bug Fixes
* fix critical type error
```

The key difference: Beta entries are minimal because they're transient, while Stable and Backport entries are detailed so consumers know exactly what changed.
