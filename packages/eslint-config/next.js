import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReact from "eslint-plugin-react";
import globals from "globals";
import pluginNext from "@next/eslint-plugin-next";
import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const nextJsConfig = [
  ...baseConfig,
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
      // Prop types not needed with TypeScript
      "react/prop-types": "off",
      // Allow display name to be inferred
      "react/display-name": "off",
      // Allow unescaped entities in JSX
      "react/no-unescaped-entities": "off",
      // Allow unknown properties (for custom attributes)
      "react/no-unknown-property": "off",
      // Allow unused vars with _ prefix or common patterns
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_|^React$",
        "caughtErrorsIgnorePattern": "^_|^err"
      }],
      // Allow explicit any with warning instead of error
      "@typescript-eslint/no-explicit-any": "off",
      // Allow @ts-ignore comments
      "@typescript-eslint/ban-ts-comment": "off",
      // Allow empty patterns in destructuring
      "no-empty-pattern": "off",
      // Allow require imports (for tailwind config etc)
      "@typescript-eslint/no-require-imports": "off",
      // Allow empty functions
      "@typescript-eslint/no-empty-function": "off",
    },
  },
];
