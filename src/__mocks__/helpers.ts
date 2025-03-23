const helpers = jest.requireActual<typeof import("../helpers")>("../helpers");
const mockHelpers = jest.createMockFromModule<typeof import("../helpers")>("../helpers");

module.exports = {
	...helpers,
	MINIMUM_MOOD_LIFESPAN: 0
};