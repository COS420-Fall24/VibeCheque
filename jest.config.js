// @ts-expect-error(2307)
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    resetMocks: true,
    collectCoverageFrom: [
        "src/**/*.{js,jsx,ts,tsx}",
        "!<rootDir>/node_modules/",
        "!src/serviceWorker.js",
        "!src/setupTests.js",
        "!src/components/Auth/*",
        "!src/index.js",
    ],
    coverageReporters: ["text", "lcov"],
};
