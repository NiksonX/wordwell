import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next already registers the jsx-a11y plugin but enables only a handful of its rules.
// Reuse that plugin instance (no extra dependency) to turn on its full recommended set.
const jsxA11y = nextVitals.find((config) => config.plugins?.["jsx-a11y"])?.plugins["jsx-a11y"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Accessibility must stay at 100 in Lighthouse (see AGENTS.md), so catch a11y issues at lint time.
    rules: jsxA11y?.configs.recommended.rules ?? {},
  },
  {
    rules: {
      // `_`-prefixed names are intentionally unused.
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }],
      // Types-only imports use `import type` (keeps them out of the client bundle).
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "separate-type-imports" }],
      "import/no-duplicates": "error",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react/self-closing-comp": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
