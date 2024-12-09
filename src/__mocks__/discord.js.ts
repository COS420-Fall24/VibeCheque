import { RESTOptions } from "discord.js";

const discordJS = jest.requireActual<typeof import("discord.js")>("discord.js");
const mockDiscordJS = jest.createMockFromModule<typeof import("discord.js")>("discord.js");

mockDiscordJS.EmbedBuilder = discordJS.EmbedBuilder;
mockDiscordJS.ApplicationCommandOptionType = discordJS.ApplicationCommandOptionType;
mockDiscordJS.GatewayIntentBits = discordJS.GatewayIntentBits;
mockDiscordJS.Collection = discordJS.Collection;

Object.defineProperty(mockDiscordJS, "Routes", {
    writable: true,
    value: { ...discordJS.Routes }
});

class MockREST extends discordJS.REST {
    put: jest.Mock;
    setToken: jest.Mock;

    constructor(options?: RESTOptions) {
        super(options);
        this.put = jest.fn().mockResolvedValue({});
        this.setToken = jest.fn().mockReturnThis();
    }
}

// @ts-ignore
mockDiscordJS.REST = MockREST;

module.exports = mockDiscordJS;