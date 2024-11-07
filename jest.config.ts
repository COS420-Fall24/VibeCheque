/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    resetMocks: true,
    collectCoverageFrom: [
        "src/**/*.{js,ts}",
        "!<rootDir>/node_modules/"
    ],
    coverageReporters: ["text", "lcov"],
};
