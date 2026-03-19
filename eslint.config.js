/**
 * ESLint flat config for FlowHook.
 * Lints TypeScript (.ts, .mts, .cts) and JavaScript (.js, .mjs, .cjs).
 * Prettier handles formatting (eslint-config-prettier disables conflicts).
 */
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ["src/**/*.{ts,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["*.{ts,mts,cts}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  {
    files: ["**/*.cjs"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "commonjs",
      },
    },
  },
  {
    ignores: ["node_modules/", "dist/", "coverage/", "drizzle/"],
  },
];
