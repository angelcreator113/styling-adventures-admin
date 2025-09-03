/* eslint-env node */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ["eslint:recommended", "google"],
  parserOptions: { ecmaVersion: "latest", sourceType: "script" },
  rules: {
    "require-jsdoc": "off",
    "max-len": "off",
    "quote-props": "off",
    quotes: ["error", "double", { allowTemplateLiterals: true }],
    "object-curly-spacing": ["error", "always"],
    "no-multi-spaces": "off",
    "comma-dangle": ["error", "only-multiline"],
    indent: ["warn", 2, { SwitchCase: 1 }],

    // ✅ make lint happy on Windows + our ternary layout + empty catch
    "linebreak-style": "off",
    "operator-linebreak": "off",
    "no-empty": ["error", { allowEmptyCatch: true }],
  },
  ignorePatterns: ["**/node_modules/**", "**/dist/**", "**/*.test.js"],
};
