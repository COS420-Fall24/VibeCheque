/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    resetMocks: true,
    collectCoverageFrom: [
        "<rootDir>/src/**/*.{js,ts}",
        "!<rootDir>/node_modules/",
        "!<rootDir>/src/testing/",
        "!<rootDir>/build/"
    ],
    coverageReporters: ["text", "lcov"],
};
