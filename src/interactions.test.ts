import { CacheType, ChatInputCommandInteraction, EmbedBuilder, Message, MessageComponentBuilder, MessageContextMenuCommandInteraction, MessagePayload } from "discord.js";
import { embed, ping, tone, mood, requestAnonymousClarification } from "./interactions";
import MockDiscord from "./testing/mocks/mockDiscord";
import { analyzeTone } from "./gptRequests";
jest.mock("./gptRequests")

jest.mock('firebase/database', () => {
    const mockSnapshot = {
        exists: () => true,
        val: () => ({ mood: "previous-mood" })
    };

    // Mock functions that will be exported
    const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
    const mockChild = jest.fn((_, path) => {
        return `servers/${path}`;
    });
    const mockRef = jest.fn().mockReturnValue('mock-ref');

    return {
        get: mockGet,
        child: mockChild,
        ref: mockRef,
        set: jest.fn().mockResolvedValue(undefined),
        getDatabase: jest.fn().mockReturnValue({
            ref: mockRef
        })
    };
});

describe("Testing slash commands", ()=>{
    test("`ping` function defers a reply, then replies with \"pong!\" after 1000 ms", async ()=>{
        const discord = new MockDiscord({ command: "/ping" });

        const interaction = discord.getInteraction() as ChatInputCommandInteraction;
        const spyDeferReply = jest.spyOn(interaction, "deferReply");
        const spyEditReply = jest.spyOn(interaction, "editReply");

        const startTime = jest.getRealSystemTime();
        await ping(interaction);
        const endTime = jest.getRealSystemTime();

        expect(endTime-startTime).toBeGreaterThanOrEqual(1000);
        expect(spyDeferReply).toHaveBeenCalled();
        expect(spyEditReply).toHaveBeenCalledWith("pong!");
    });

    test("`embed` function replies with \"Purple Embed\" and \"Green Embed\", respectively", async ()=>{
        const discord = new MockDiscord({ command: "/embed" });

        const interaction = discord.getInteraction() as ChatInputCommandInteraction;

        await embed(interaction);

        const reply = discord.getInteractionReply() as any;

        expect(reply).toHaveProperty("embeds");
        expect(reply.embeds).toHaveProperty("length");
        expect(reply.embeds.length).toBe(2);
        expect(reply.embeds[0] instanceof EmbedBuilder).toBeTruthy();
        expect(reply.embeds[1] instanceof EmbedBuilder).toBeTruthy();

        const embed1: EmbedBuilder = reply.embeds[0];
        const embed2: EmbedBuilder = reply.embeds[1];

        expect(embed1.data.title).toMatch(/Purple Embed/);
        expect(embed2.data.title).toMatch(/Green Embed/);
    });

    test("`tone` function defers a reply, then replies with something other than \"Something went wrong.\"", async ()=>{
        const discord = new MockDiscord({ command: "/tone" });

        const message = discord.createMockMessage({
            content: "This is a test message"
        })
        const interaction = discord.createMockMessageCommand("Tone", message);

        const spyDeferReply = jest.spyOn(interaction, "deferReply");
        const spyEditReply = jest.spyOn(interaction, "editReply");
        (analyzeTone as jest.Mock).mockReturnValue("this message has a TONE tone")

        await tone(interaction);

        expect(spyDeferReply).toHaveBeenCalled();
        expect(spyEditReply).not.toHaveBeenCalledWith("Something went wrong.");
    });

    test("`mood` command correctly sets 'happy' mood in database and guild, and removes old mood 'angry'", async () => {
        const discord = new MockDiscord({ 
            command: "/mood", 
            commandOptions: { currentmood: "happy" }
        });

        expect(discord.getRoles().find(role => role.name === "angry")).toBeUndefined();

        discord.addRoleToGuild("angry", "000000");
        discord.addRoleToGuild("happy", "000000");
        discord.addRoleToMember("angry");

        expect(discord.getRoles().find(role => role.name === "angry")).toBeDefined();

        const interaction = discord.getInteraction() as ChatInputCommandInteraction;
        
        // Add required properties to interaction
        Object.defineProperty(interaction, 'guildId', {
            get: jest.fn(() => 'mock-guild-id')
        });
        Object.defineProperty(interaction, 'createdTimestamp', {
            get: jest.fn(() => 1234567890)
        });

        const { set: mockSet, get: mockGet } = require('firebase/database');
        mockSet.mockReset();
        mockGet.mockReset();
        mockGet.mockResolvedValue({
            exists: () => true,
            val: () => ({ mood: "angry" })
        });

        await mood(interaction);

        // Check that the array of calls includes our expected call
        expect(mockSet.mock.calls).toContainEqual([
            undefined,
            {
                mood: "happy",
                timestamp: 1234567890
            }
        ]);

        expect(discord.getRoles().find(role => role.name === "angry")).toBeDefined();
        expect(discord.getMemberRoles().find(role => role.name === "happy")).toBeDefined();
        expect(discord.getMemberRoles().find(role => role.name === "angry")).toBeUndefined();


    });

    test("`mood` command first time usage. No data in database", async () => {
        const discord = new MockDiscord({ 
            command: "/mood", 
            commandOptions: { currentmood: "excited" }
        });

        const interaction = discord.getInteraction() as ChatInputCommandInteraction;
        
        // Add required properties to interaction
        Object.defineProperty(interaction, 'guildId', {
            get: jest.fn(() => 'mock-guild-id')
        });
        Object.defineProperty(interaction, 'createdTimestamp', {
            get: jest.fn(() => 1234567890)
        });

        const { set: mockSet, get: mockGet } = require('firebase/database');
        mockSet.mockReset();
        mockGet.mockReset();
        mockGet.mockResolvedValue({
            exists: () => false,
            val: () => null
        });

        await mood(interaction);

        // Check that the array of calls includes our expected call
        expect(mockSet.mock.calls).toContainEqual([
            undefined,
            {
                mood: "excited",
                timestamp: 1234567890
            }
        ]);
    });
});
describe("Testing requestAnonymousClarification command", () => {
    console.log("Describe block is being executed."); // Debugging

    test("should defer the reply and send an anonymous request to the target message author", async () => {
        console.log("Test is being executed."); // Debugging
        const discord = new MockDiscord({ command: "Request Clarification" });

        const mockMessage = discord.createMockMessageWithDM();
        const interaction = discord.createMockMessageCommand("Request Clarification", mockMessage);

        const spyDeferReply = jest.spyOn(interaction, "deferReply");
        const spyEditReply = jest.spyOn(interaction, "editReply");

        await requestAnonymousClarification(interaction);

        expect(spyDeferReply).toHaveBeenCalledWith({ ephemeral: true });
        expect(mockMessage.author.send).toHaveBeenCalledWith(
            `You've received an anonymous request for clarification on your message: "${mockMessage.content}". Will you clarify your tone?`
        );
        expect(spyEditReply).toHaveBeenCalledWith({
            content: "Your request for anonymous clarification has been sent.",
        });
    });
});