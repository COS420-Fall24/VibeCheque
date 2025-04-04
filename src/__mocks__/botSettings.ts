const botSettings = jest.requireActual<typeof import("../botSettings")>("../botSettings");
const mockBotSettings = jest.createMockFromModule<typeof import("../botSettings")>("../botSettings");

mockBotSettings.getUserSetting = jest.fn().mockResolvedValue("enabled");
mockBotSettings.getServerSetting = jest.fn().mockResolvedValue("active");
mockBotSettings.toggleServerSetting = jest.fn().mockResolvedValue("inactive");

module.exports = mockBotSettings;