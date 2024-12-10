import * as discordJS from "discord.js";
import * as discordApp from "./discordApp";
import * as interactions from "./interactions";
import { MockDiscord } from "./testing/mocks/mockDiscord";
jest.mock("./interactions");

describe("Testing discordApp.ts functions", () => {
    beforeAll(() => {
        process.env.DISCORD_TOKEN = "test-token";
    });

    describe("Testing launchBot's initialization", () => {
        /**
         * launchBot should return a Client with the minimum intents:
         * - GatewayIntentBits.GuildEmojisAndStickers
         * - GatewayIntentBits.GuildVoiceStates
         * - GatewayIntentBits.Guilds
         * - GatewayIntentBits.GuildMessages
         * - GatewayIntentBits.DirectMessages
         * - GatewayIntentBits.MessageContent
         */
        test("launchBot should return a Client with the minimum intents and login to the bot using the DISCORD_TOKEN environment variable", async () => {
            const client = await discordApp.launchBot();

            const minimumIntents = discordJS.GatewayIntentBits.GuildEmojisAndStickers |
                discordJS.GatewayIntentBits.GuildVoiceStates |
                discordJS.GatewayIntentBits.Guilds |
                discordJS.GatewayIntentBits.GuildMessages |
                discordJS.GatewayIntentBits.DirectMessages |
                discordJS.GatewayIntentBits.MessageContent;

            expect(client).toBeInstanceOf(discordJS.Client);

            // check that the client has the minimum intents using bitwise AND:
            // e.g. 0b01101001 (actual intents) & 0b01001001 (minimum intents) = 0b01001001 (minimum intents)
            // => the intents contain the minimum intents
            // but e.g. 0b01101001 (actual intents) & 0b11111111 (minimum intents) = 0b01101001 (NOT minimum intents)
            // => the intents do not contain the minimum intents
            expect(client.options.intents.bitfield & minimumIntents).toBe(minimumIntents);

            expect(client.token).toBe(process.env.DISCORD_TOKEN);
        });

        /**
         * the client should print a message when it is ready (client.on(Events.ClientReady, () => { ... }))
         * 
         * the message should be "client \"ready\": Logged in as testuser#1234!"
         */
        test("the client should print \"client \"ready\": Logged in as testuser#1234!\" when it is ready and the user exists", async () => {
            const spyClientOn = jest.spyOn(discordJS.Client.prototype, "on");

            const client = await discordApp.launchBot();
            // mock the client.user to be a mock client user
            // @ts-ignore
            client.user = new discordJS.ClientUser(client) as discordJS.ClientUser;

            const clientReadyListener = spyClientOn.mock.calls.find(call => call[0] === discordJS.Events.ClientReady)?.[1];
            expect(clientReadyListener).toBeDefined();

            const spyConsoleLog = jest.spyOn(console, "log");

            clientReadyListener?.();

            expect(spyConsoleLog).toHaveBeenCalledWith("client \"ready\": Logged in as testuser#1234!");
        });

        /**
         * the client should print a message when it is ready (client.on(Events.ClientReady, () => { ... }))
         * 
         * if the user does not exist, the message should be "client \"ready\": client.user is null!"
         */
        test("the client should print \"client \"ready\": client.user is null!\" when it is ready and the user does not exist", async () => {
            const spyClientOn = jest.spyOn(discordJS.Client.prototype, "on");

            const client = await discordApp.launchBot();
            // mock the client.user to be null
            // @ts-ignore
            client.user = null;

            const clientReadyListener = spyClientOn.mock.calls.find(call => call[0] === discordJS.Events.ClientReady)?.[1];
            expect(clientReadyListener).toBeDefined();

            const spyConsoleError = jest.spyOn(console, "error").mockImplementation(() => {}); // mock the console.error function to do nothing

            clientReadyListener?.();

            expect(spyConsoleError).toHaveBeenCalledWith("client \"ready\": client.user is null!");
        });
    });

    describe("Testing launchBot's post-initialization functionality", () => {
        /**
         * the client should handle slash commands by calling the appropriate function:
         * - /ping: interactions.ts -> ping();
         * - /embed: interactions.ts -> embed();
         * - /mood: interactions.ts -> mood();
         */
        test("the client should handle a message that mentions the bot", async () => {
            const discord = new MockDiscord({ command: "ping" });

            const pingInteraction = discord.createMockChatInputCommand("ping");
            const embedInteraction = discord.createMockChatInputCommand("embed");
            const moodInteraction = discord.createMockChatInputCommand("mood");

            const spyPing = jest.spyOn(interactions, "ping");
            const spyEmbed = jest.spyOn(interactions, "embed");
            const spyMood = jest.spyOn(interactions, "mood");

            const spyClientOn = jest.spyOn(discordJS.Client.prototype, "on");

            await discordApp.launchBot();

            const clientInteractionCreateListener: Function = spyClientOn.mock.calls.find(call => call[0] === discordJS.Events.InteractionCreate)?.[1] as Function;
            expect(clientInteractionCreateListener).toBeDefined();

            await clientInteractionCreateListener?.(pingInteraction);
            expect(spyPing).toHaveBeenCalled();

            await clientInteractionCreateListener?.(embedInteraction);
            expect(spyEmbed).toHaveBeenCalled();

            await clientInteractionCreateListener?.(moodInteraction);
            expect(spyMood).toHaveBeenCalled();
        });

        /**
         * the client should handle message commands by calling the appropriate function:
         * - Tone: interactions.ts -> tone();
         * - Clarify: interactions.ts -> clarify();
         * - Request Anonymous Clarification: interactions.ts -> requestAnonymousClarification();
         */
        test("the client should handle message context menu commands", async () => {
            const discord = new MockDiscord({ command: "Tone" });
            const mockMessage = discord.createMockMessage({});

            const toneInteraction = discord.createMockMessageCommand("Tone", mockMessage);
            const clarifyInteraction = discord.createMockMessageCommand("Clarify", mockMessage);
            const requestClarificationInteraction = discord.createMockMessageCommand("Request Anonymous Clarification", mockMessage);

            const spyTone = jest.spyOn(interactions, "tone");
            const spyClarify = jest.spyOn(interactions, "clarify");
            const spyRequestClarification = jest.spyOn(interactions, "requestAnonymousClarification");

            const spyClientOn = jest.spyOn(discordJS.Client.prototype, "on");

            await discordApp.launchBot();

            const clientInteractionCreateListener: Function = spyClientOn.mock.calls.find(call => call[0] === discordJS.Events.InteractionCreate)?.[1] as Function;
            expect(clientInteractionCreateListener).toBeDefined();

            await clientInteractionCreateListener?.(toneInteraction);
            expect(spyTone).toHaveBeenCalled();

            await clientInteractionCreateListener?.(clarifyInteraction);
            expect(spyClarify).toHaveBeenCalled();

            await clientInteractionCreateListener?.(requestClarificationInteraction);
            expect(spyRequestClarification).toHaveBeenCalled();
        });

        /**
         * the client should hanle unknown interaction types by printing the interaction
         */
        test("the client should hanle unknown interaction types by printing the interaction", async () => {
            const discord = new MockDiscord({ command: "ping" });
            const mockInteraction = discord.createMockInteraction("unknown function", discord.getGuild(), discord.getGuildMember());

            const spyConsoleLog = jest.spyOn(console, "log").mockImplementation(() => {}); // mock the console.log function to do nothing

            const spyClientOn = jest.spyOn(discordJS.Client.prototype, "on");

            await discordApp.launchBot();

            const clientInteractionCreateListener: Function = spyClientOn.mock.calls.find(call => call[0] === discordJS.Events.InteractionCreate)?.[1] as Function;
            expect(clientInteractionCreateListener).toBeDefined();

            await clientInteractionCreateListener?.(mockInteraction);

            expect(spyConsoleLog).toHaveBeenCalledWith(mockInteraction);
        });

        /**
         * the client should handle message events by printing the message content
         */
        test("the client should handle message events by printing the message content", async () => {
            const discord = new MockDiscord({ command: "ping" });
            const mockMessage = discord.createMockMessage({ content: "TEST MESSAGE CONTENT" });

            const spyConsoleLog = jest.spyOn(console, "log");

            const spyClientOn = jest.spyOn(discordJS.Client.prototype, "on");

            await discordApp.launchBot();

            const clientMessageCreateListener: Function = spyClientOn.mock.calls.find(call => call[0] === discordJS.Events.MessageCreate)?.[1] as Function;
            expect(clientMessageCreateListener).toBeDefined();

            await clientMessageCreateListener?.(mockMessage);

            expect(spyConsoleLog).toHaveBeenCalledWith("TEST MESSAGE CONTENT");
        });
    });
});
