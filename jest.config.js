const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  coverageProvider: "v8",
  projects: [
    {
      displayName: "API Tests",
      testEnvironment: "node",
      testMatch: ["<rootDir>/__tests__/utils/**/*.test.{js,ts}"],
      setupFilesAfterEnv: ["<rootDir>/__tests__/jest.setup.api.js"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
      },
      transform: {
        "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
      },
    },
    {
      displayName: "Component Tests",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/__tests__/contexts/**/*.test.{js,ts,tsx}"],
      setupFilesAfterEnv: ["<rootDir>/__tests__/jest.setup.components.js"],
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
      },
      transform: {
        "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
      },
    },
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/index.{js,jsx,ts,tsx}",
  ],
};

module.exports = createJestConfig(config);
