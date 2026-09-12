/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2021, sourceType: "module" },
  plugins: ["@typescript-eslint", "react-hooks", "react-refresh"],
  settings: {},
  ignorePatterns: [
    "dist",
    "node_modules",
    "coverage",
    "scripts/prerender.mjs",
    ".eslintrc.cjs",
    "postcss.config.js",
  ],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react-refresh/only-export-components": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "no-empty": ["error", { allowEmptyCatch: true }],
  },
  overrides: [
    {
      files: ["netlify/**/*.ts"],
      env: { browser: false, node: true },
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"],
      env: { node: true },
    },
  ],
};
