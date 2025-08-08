module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  collectCoverageFrom: [
    "**/*.ts",
    "!**/node_modules/**",
    "!**/tests/**",
    "!**/coverage/**",
    "!jest.config.js",
    "!**/dist/**",
    "!**/*.d.ts",
  ],
};
