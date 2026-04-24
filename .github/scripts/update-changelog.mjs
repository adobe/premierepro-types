#!/usr/bin/env node

/*
 * Copyright 2026 Adobe. All rights reserved.
 *
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/**
 * Updates CHANGELOG.md with a new entry for the given release.
 *
 * All release types generate entries from conventional commits:
 *   - Beta:     feat/fix commits since the previous tag (beta or stable)
 *   - Stable:   feat/fix commits since the last stable tag (cumulative over all betas)
 *   - Backport: all non-chore commits since the previous tag on the release branch
 *
 * Environment variables:
 *   RELEASE_TYPE - 'beta' | 'stable' | 'backport'
 *   VERSION      - the new version string (e.g. '26.3.0-beta.1')
 *   REPO_URL     - GitHub repository URL for commit links
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const {
  RELEASE_TYPE,
  VERSION,
  REPO_URL = "https://github.com/adobe/premierepro-types",
} = process.env;

const date = new Date().toISOString().split("T")[0];

/** Inserts a new CHANGELOG entry after the `# Changelog` header. */
function insertEntry(entry) {
  const content = readFileSync("CHANGELOG.md", "utf8");
  const insertPoint = content.indexOf("\n## ");
  const newContent =
    insertPoint !== -1
      ? content.slice(0, insertPoint) + "\n\n" + entry.trimEnd() + content.slice(insertPoint)
      : content.trimEnd() + "\n\n" + entry.trimEnd() + "\n\n";
  writeFileSync("CHANGELOG.md", newContent);
  console.log(`Updated CHANGELOG.md for ${VERSION}`);
}

/** Returns commits between fromTag (exclusive) and HEAD, excluding merge commits. */
function getCommits(fromTag) {
  const range = fromTag ? `${fromTag}..HEAD` : "HEAD";
  const log = execSync(`git log ${range} --pretty=format:"%s|%H" --no-merges`, {
    encoding: "utf8",
  }).trim();
  return log
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const idx = line.lastIndexOf("|");
      return {
        msg: line.slice(0, idx),
        shortHash: line.slice(idx + 1, idx + 8),
        fullHash: line.slice(idx + 1),
      };
    });
}

/** Groups commits by conventional type and formats as markdown. */
function formatCommits(commits) {
  const features = [];
  const fixes = [];

  for (const { msg, shortHash, fullHash } of commits) {
    const link = `([${shortHash}](${REPO_URL}/commit/${fullHash}))`;
    if (/^feat(\([^)]+\))?!?:/.test(msg)) {
      features.push(`* ${msg.replace(/^feat(\([^)]+\))?!?:\s*/, "")} ${link}`);
    } else if (/^fix(\([^)]+\))?!?:/.test(msg)) {
      fixes.push(`* ${msg.replace(/^fix(\([^)]+\))?!?:\s*/, "")} ${link}`);
    }
  }

  let out = "";
  if (features.length) out += `### Features\n\n${features.join("\n")}\n\n`;
  if (fixes.length) out += `### Bug Fixes\n\n${fixes.join("\n")}\n\n`;
  return out || "No notable changes.\n\n";
}

switch (RELEASE_TYPE) {
  case "beta": {
    // Entry from feat/fix commits since the previous tag (the last beta tag,
    // or the last stable tag for the first beta of a new cycle).
    let lastTag = "";
    try {
      lastTag = execSync("git describe --tags --abbrev=0", { encoding: "utf8" }).trim();
    } catch {}

    const commits = getCommits(lastTag);
    insertEntry(`## ${VERSION} (${date})\n\n${formatCommits(commits)}`);
    break;
  }

  case "stable": {
    // Full entry from all feat/fix commits since the last stable tag.
    const lastStable = execSync("git tag --sort=-version:refname", { encoding: "utf8" })
      .split("\n")
      .map((t) => t.trim())
      .find((t) => /^v\d+\.\d+\.\d+$/.test(t));

    const commits = getCommits(lastStable);
    insertEntry(`## ${VERSION} (${date})\n\n${formatCommits(commits)}`);
    break;
  }

  case "backport": {
    // Entry from non-chore commits since the most recent tag on this branch.
    let lastTag = "";
    try {
      lastTag = execSync("git describe --tags --abbrev=0", { encoding: "utf8" }).trim();
    } catch {}

    const commits = getCommits(lastTag).filter(({ msg }) => !/^(?:chore|build|ci)[\(:]/.test(msg));

    const entries = commits.map(
      ({ msg, shortHash, fullHash }) => `* ${msg} ([${shortHash}](${REPO_URL}/commit/${fullHash}))`
    );

    const body = entries.length ? entries.join("\n") + "\n" : "Maintenance release.\n";
    insertEntry(`## ${VERSION} (${date})\n\n${body}`);
    break;
  }

  default:
    console.error(`::error::Unknown RELEASE_TYPE '${RELEASE_TYPE}'.`);
    process.exit(1);
}
