# @adobe/premierepro

Type Definitions and Declarations for Adobe's Premiere UXP APIs.

This package only ships **type information**; it does not replace that runtime module. The type declaration file(s) are generated automatically as updates are made.

## Getting Started

1. Install `@adobe/premierepro` via your preferred package manager
    ```sh
    npm install -D @adobe/premierepro
    pnpm add -D @adobe/premierepro
    yarn add -D @adobe/premierepro
    bun add -d @adobe/premierepro
    deno add --dev npm:@adobe/premierepro
    ```

1. Optionally, you might also install the UXP Type Definitions if you plan on using native UXP functions:
    ```sh
    npm install -D @adobe/cc-ext-uxp-types
    pnpm add -D @adobe/cc-ext-uxp-types
    yarn add -D @adobe/cc-ext-uxp-types
    bun add -d @adobe/cc-ext-uxp-types
    deno add --dev npm:@adobe/cc-ext-uxp-types
    ```

    Refer to the documentation in the [UXP Type Definitions repository](https://github.com/adobe/cc-ext-uxp-types) for additional setup instructions.

## Usage

At runtime, UXP exposes the Premiere API through the host module id `premierepro` (for example `require('premierepro')`).

### TypeScript

Use **type-only imports** from the package for editor and compiler checking, and **`require('premierepro')`** (or your bundler’s equivalent) for the real API object:

```typescript
import type { premierepro, Project, ProjectItem } from '@adobe/premierepro';

const ppro = require('premierepro') as premierepro;

/**
 * @param project the Project to get selected items for
 * @returns a Promise resolving to the currently selected items in the
 * Project Panel
 */
async function getSelectedProjectItems(project: Project): ProjectItem[] {
  console.log(`Getting selected project items for project: ${project.name}`)

  const selection = await ppro.ProjectUtils.getSelection()
  return selection.getItems()
}
```

Adjust `import type { … }` to list whichever named types you need from the declarations.

### JavaScript (JSDoc)

In `.js` files, VS Code and the TypeScript language service can use JSDoc for IntelliSense. Enable checking if you want `tsc` to validate those files too (for example `"checkJs": true` in `jsconfig.json` / `tsconfig.json`).

**Prefer a single `@import` ([TypeScript 5.5+](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#the-jsdoc-import-tag))** so you do not repeat `import("@adobe/premierepro").…` on every tag:

```javascript
// @ts-check

/** @import { premierepro, Project, ProjectItem } from "@adobe/premierepro" */

/** @type {premierepro} */
const ppro = require('premierepro');

/**
 * @param {Project} project the Project to get selected items for
 * @returns {Promise<ProjectItem[]>} a Promise resolving to the currently
 * selected items in the Project Panel
 */
async function getSelectedProjectItems(project) {
  console.log(`Getting selected project items for project: ${project.name}`)

  const selection = await ppro.ProjectUtils.getSelection(project)
  return selection.getItems()
}
```

**Older toolchains:** define local names once with `@typedef`, then use those names in `@param` / `@returns`:

```javascript
// @ts-check

/**
 * @typedef {import("@adobe/premierepro").premierepro} premierepro
 * @typedef {import("@adobe/premierepro").Project} Project
 * @typedef {import("@adobe/premierepro").ProjectItem} ProjectItem
 */

/** @type {premierepro} */
const ppro = require('premierepro');

/**
 * @param {Project} project the Project to get selected items for
 * @returns {Promise<ProjectItem[]>} a Promise resolving to the currently
 * selected items in the Project Panel
 */
async function getSelectedProjectItems(project) {
  console.log(`Getting selected project items for project: ${project.name}`)

  const selection = await ppro.ProjectUtils.getSelection(project)
  return selection.getItems()
}
```
