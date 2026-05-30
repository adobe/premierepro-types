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
 * Opens a PR on main to begin the next beta cycle after a stable release.
 * Bumps package.json/package-lock.json to X.Y.0-beta.0 and opens a PR.
 *
 * The resulting commit message ('chore: begin X.Y.0-beta.0 cycle') does NOT
 * match the release commit pattern, so the publish workflow will ignore it.
 *
 * Environment variables:
 *   NEXT_CYCLE - base version for the next cycle (e.g. '26.4.0' or '27.0.0' for a major bump)
 *   GH_TOKEN   - GitHub token with repo + pull-requests write access
 */

import { execSync } from "node:child_process";

const { NEXT_CYCLE } = process.env;

if (!NEXT_CYCLE) {
  console.error("::error::NEXT_CYCLE is required.");
  process.exit(1);
}

const nextBeta = `${NEXT_CYCLE}-beta.0`;
const branch = `release-prep/${nextBeta}`;

function run(cmd) {
  console.log(`$ ${cmd}`);
  return execSync(cmd, { encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] });
}

run('git config user.name "github-actions[bot]"');
run('git config user.email "github-actions[bot]@users.noreply.github.com"');

// Bump both package.json and package-lock.json.
run(`npm version ${nextBeta} --no-git-tag-version`);

run(`git checkout -b "${branch}"`);
run("git add package.json package-lock.json");
run(`git commit -m "chore: begin ${nextBeta} cycle"`);
run(`git push origin "${branch}"`);

run(
  `gh pr create ` +
    `--title "chore: begin ${nextBeta} cycle" ` +
    `--body "Opens the **${NEXT_CYCLE}** beta cycle on \`main\` following the stable release. Merge this PR to start accepting beta changes for ${NEXT_CYCLE}." ` +
    `--base main ` +
    `--head "${branch}"`
);

console.log(`\nOpened next-cycle PR for ${nextBeta}.`);
