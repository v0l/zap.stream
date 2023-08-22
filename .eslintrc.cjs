module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  root: true,
  ignorePatterns: ["build/", "*.test.ts", "*.js"],
  env: {
    browser: true,
    worker: true,
    commonjs: true,
    node: false,
  },
  rules: {
    "@typescript-eslint/no-non-null-assertion": "error",
    "require-await": "error",
    eqeqeq: "error",
    "object-shorthand": "warn",
  },
};
