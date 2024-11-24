import { RESTOptions } from "discord.js";

const discordJS = jest.requireActual<typeof import("discord.js")>("discord.js");
const mockDiscordJS = jest.createMockFromModule<typeof import("discord.js")>("discord.js");

const asyncJestFn = (): jest.Mock => jest.fn(async () => {});

mockDiscordJS.EmbedBuilder = discordJS.EmbedBuilder;

Object.defineProperty(mockDiscordJS, "Routes", {
    writable: true,
    value: { ...discordJS.Routes }
});

// @ts-ignore
mockDiscordJS.REST = jest.fn().mockImplementation((options?: RESTOptions) => {
    return {
        put: asyncJestFn(),
        setToken: jest.fn().mockReturnThis()
    };
});

mockDiscordJS.REST.prototype.put = asyncJestFn();
mockDiscordJS.REST.prototype.setToken = jest.fn().mockReturnThis();

module.exports = mockDiscordJS;