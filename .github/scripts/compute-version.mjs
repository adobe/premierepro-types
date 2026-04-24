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
 * Computes the next version for a release and writes it to GITHUB_OUTPUT.
 *
 * Environment variables:
 *   RELEASE_TYPE  - 'beta' | 'stable' | 'backport'
 *   BUILD_NUMBER  - (beta only) optional explicit prerelease number; auto-increments if not set
 *   GITHUB_OUTPUT - set automatically by GitHub Actions
 */

import { readFileSync, appendFileSync } from "node:fs";

const { RELEASE_TYPE, BUILD_NUMBER, GITHUB_OUTPUT } = process.env;

function fail(message) {
  console.error(`::error::${message}`);
  process.exit(1);
}

function setOutput(key, value) {
  if (GITHUB_OUTPUT) {
    appendFileSync(GITHUB_OUTPUT, `${key}=${value}\n`);
  }
  console.log(`  ${key} = ${value}`);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const current = pkg.version;

console.log(`Current version: ${current}`);
console.log(`Release type:    ${RELEASE_TYPE}`);

switch (RELEASE_TYPE) {
  case "beta": {
    if (!/^\d+\.\d+\.\d+-beta\.\d+$/.test(current)) {
      fail(
        `Current version '${current}' is not a beta version (expected X.Y.Z-beta.N). ` +
          `Is this the right branch? main should be on a beta version during active development.`
      );
    }
    const base = current.replace(/-beta\.\d+$/, "");
    const currentN = parseInt(current.match(/beta\.(\d+)$/)[1], 10);
    const nextN = BUILD_NUMBER ? parseInt(BUILD_NUMBER, 10) : currentN + 1;
    setOutput("version", `${base}-beta.${nextN}`);
    break;
  }

  case "stable": {
    if (!/^\d+\.\d+\.\d+-beta\.\d+$/.test(current)) {
      fail(
        `Current version '${current}' is not a beta version. ` +
          `Cannot cut a stable release — main must be on a beta version first.`
      );
    }
    setOutput("version", current.replace(/-beta\.\d+$/, ""));
    break;
  }

  case "backport": {
    if (!/^\d+\.\d+\.\d+$/.test(current)) {
      fail(
        `Current version '${current}' is not a stable version (expected X.Y.Z). ` +
          `Backports must target a release/* branch at a stable version.`
      );
    }
    const [major, minor, patch] = current.split(".").map(Number);
    setOutput("version", `${major}.${minor}.${patch + 1}`);
    break;
  }

  default:
    fail(`Unknown RELEASE_TYPE '${RELEASE_TYPE}'. Expected 'beta', 'stable', or 'backport'.`);
}
