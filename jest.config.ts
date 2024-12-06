/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    clearMocks: true,
    resetMocks: false,
    collectCoverageFrom: [
        "<rootDir>/src/**/*.{js,ts}",
        "!<rootDir>/node_modules/",
        "!<rootDir>/src/testing/",
        "!<rootDir>/build/"
    ],
    coverageReporters: ["text", "lcov"],
};
