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
 * Extracts the CHANGELOG entry for a specific version and writes it to a file
 * for use as GitHub release notes.
 *
 * Environment variables:
 *   VERSION     - the version to extract (e.g. '26.3.0')
 *   OUTPUT_FILE - path to write the extracted notes (default: /tmp/release-notes.md)
 */

import { readFileSync, writeFileSync } from "fs";

const { VERSION, OUTPUT_FILE = "/tmp/release-notes.md" } = process.env;

const content = readFileSync("CHANGELOG.md", "utf8");

// Match the section for VERSION up to (but not including) the next ## heading.
const escaped = VERSION.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const match = content.match(new RegExp(`## ${escaped} [\\s\\S]*?(?=\\n## |$)`));
const notes = match ? match[0].trim() : `Release ${VERSION}.`;

writeFileSync(OUTPUT_FILE, notes);
console.log(`Extracted release notes for ${VERSION} -> ${OUTPUT_FILE}`);
