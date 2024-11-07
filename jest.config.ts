/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    resetMocks: true,
    collectCoverageFrom: [
        "src/**/*.{ts}",
        "!<rootDir>/node_modules/",
        "!<rootDir>/build/"
    ],
    coverageReporters: ["text", "lcov"],
};
