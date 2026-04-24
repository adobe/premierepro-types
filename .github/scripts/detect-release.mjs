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
 * Detects whether the latest push to main or a release/* branch is a release
 * commit, and outputs metadata for the publish job.
 *
 * A commit is a release commit if its message starts with 'chore: release '.
 * The release type is inferred from the version in package.json and the branch.
 *
 * Outputs (via GITHUB_OUTPUT):
 *   is_release - 'true' | 'false'
 *   type       - 'beta' | 'stable' | 'backport'
 *   version    - version string from package.json
 *   dist_tag   - npm dist-tag to publish under
 *   next_cycle - (stable only) base version for the next beta cycle
 *
 * Environment variables:
 *   GITHUB_REF    - set automatically by GitHub Actions
 *   GITHUB_OUTPUT - set automatically by GitHub Actions
 */

import { readFileSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";

function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
  }
  console.log(`  ${key} = ${value}`);
}

const commitMsg = execSync("git log -1 --pretty=%B", { encoding: "utf8" }).trim();

if (!commitMsg.startsWith("chore: release ")) {
  console.log(`Not a release commit: "${commitMsg.split("\n")[0]}"`);
  setOutput("is_release", "false");
  process.exit(0);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.version;
const branch = (process.env.GITHUB_REF ?? "").replace("refs/heads/", "");

const isBeta = /-beta\.\d+$/.test(version);
const isReleaseBranch = branch.startsWith("release/");

let type, distTag;
if (isBeta) {
  type = "beta";
  distTag = "beta";
} else if (isReleaseBranch) {
  type = "backport";
  // e.g. 26.3.1 on release/26.3 -> dist-tag: release-26.3
  distTag = `release-${version.replace(/\.\d+$/, "")}`;
} else {
  type = "stable";
  distTag = "latest";
}

setOutput("is_release", "true");
setOutput("type", type);
setOutput("version", version);
setOutput("dist_tag", distTag);

if (type === "stable") {
  // The prepare-release workflow embeds the next minor version as a git commit
  // trailer so we don't need to pass it through a separate mechanism.
  const trailerMatch = commitMsg.match(/^Next-Cycle:\s*(.+)$/im);
  if (trailerMatch) {
    setOutput("next_cycle", trailerMatch[1].trim());
  } else {
    // Fallback: auto-increment minor (e.g. 26.3.0 -> 26.4.0).
    // For major version bumps (e.g. 26.x -> 27.0.0), always provide
    // next_cycle explicitly when running prepare-release.
    const [major, minor] = version.split(".").map(Number);
    setOutput("next_cycle", `${major}.${minor + 1}.0`);
  }
}

console.log(`Detected: ${type} release of ${version} (dist-tag: @${distTag})`);
