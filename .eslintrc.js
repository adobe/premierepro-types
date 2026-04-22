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

/** @type {import("eslint").Linter.BaseConfig} */
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
    warnOnUnsupportedTypeScriptVersion: true,
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
  ],
  plugins: ["@typescript-eslint", "jsdoc", "import"],
  rules: {
    "@typescript-eslint/adjacent-overload-signatures": "error",
    "@typescript-eslint/array-type": "error",

    camelcase: "off",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "interface",
        format: ["PascalCase"],
        custom: {
          regex: "^I[A-Z]",
          match: false,
        },
      },
      {
        selector: "class",
        format: ["PascalCase"],
      },
      {
        selector: ["variable", "function", "method", "accessor"],
        format: ["camelCase"],
      },
      {
        selector: ["parameter"],
        format: ["camelCase"],
        leadingUnderscore: "allow",
      },
    ],

    // "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/no-empty-object-type": "off",
    "@typescript-eslint/no-inferrable-types": "error",
    "@typescript-eslint/no-misused-new": "error",
    "@typescript-eslint/no-this-alias": "error",

    "no-unused-expressions": "off",
    "@typescript-eslint/no-unused-expressions": ["error", { allowTernary: true }],

    "@typescript-eslint/prefer-for-of": "error",
    "@typescript-eslint/prefer-function-type": "error",
    "@typescript-eslint/prefer-namespace-keyword": "error",
    "@typescript-eslint/triple-slash-reference": "error",
    "@typescript-eslint/unified-signatures": "error",

    //eslint-plugin-import
    "import/no-extraneous-dependencies": ["error", { optionalDependencies: false }],

    // eslint-plugin-jsdoc
    "jsdoc/check-alignment": "error",

    // eslint
    "constructor-super": "error",
    "dot-notation": "error",
    eqeqeq: ["error", "always", { null: "ignore" }],
    "no-caller": "error",
    "no-duplicate-case": "error",
    "no-duplicate-imports": "error",
    "no-empty": "error",
    "no-eval": "error",
    "no-extra-bind": "error",
    "no-fallthrough": "error",
    "no-new-func": "error",
    "no-new-wrappers": "error",
    "no-return-await": "error",
    "no-sparse-arrays": "error",
    "no-template-curly-in-string": "error",
    "no-throw-literal": "error",
    "no-undef-init": "error",
    "no-unsafe-finally": "error",
    "no-unused-labels": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-const": "error",
    "prefer-object-spread": "error",
    "use-isnan": "error",
  },
};
