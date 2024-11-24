import { APIEmbed, ColorResolvable, EmbedBuilder, resolveColor } from "discord.js";
jest.unmock("discord.js")

const discordJS = jest.requireActual<typeof import("discord.js")>("discord.js");
const mockDiscordJS = jest.createMockFromModule<typeof import("discord.js")>("discord.js");

mockDiscordJS.EmbedBuilder = discordJS.EmbedBuilder;

module.exports = mockDiscordJS;