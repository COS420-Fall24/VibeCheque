import { CacheType, ChatInputCommandInteraction, EmbedBuilder, InteractionEditReplyOptions, Message, MessageComponentBuilder, MessageContextMenuCommandInteraction, MessagePayload } from "discord.js";
import { embed, ping, tone, mood, clarify } from "./interactions";
import { MockDiscord } from "./testing/mocks/mockDiscord";
import { analyzeTone } from "./gptRequests";
jest.mock("./gptRequests")

type MockDatabase = {
    get: jest.Mock;
    child: jest.Mock;
    ref: jest.Mock;
    set: jest.Mock;
    getDatabase: jest.Mock;
}

jest.mock('firebase/database', (): MockDatabase => {
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
        // @ts-ignore
        child: mockChild,
        ref: mockRef,
        set: jest.fn().mockResolvedValue(undefined),
        getDatabase: jest.fn().mockReturnValue({
            ref: mockRef
        })
    };
});

describe("Testing slash commands", ()=>{
    /**
     * The ping function should defer a reply, then respond with "pong!" at least a second later if the interaction
     * is repliable
     */
    test("`ping` function defers a reply, then replies with \"pong!\" after 1000 ms if the interaction is repliable", async ()=>{
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

    /**
     * The ping function should defer a reply, then reject the promise at least a second later if the interaction
     * is repliable
    */
    test("`ping` function defers a reply, then rejects the promise after 1000 ms if the interaction is not repliable", async ()=>{
        const discord = new MockDiscord({ command: "/ping" });

        const interaction = discord.createMockInteraction("/ping", discord.getGuild(), discord.getGuildMember(), false) as ChatInputCommandInteraction;
        const spyDeferReply = jest.spyOn(interaction, "deferReply");
        const spyEditReply = jest.spyOn(interaction, "editReply");
        const spyReject = jest.fn();

        const startTime = jest.getRealSystemTime();
        await ping(interaction).catch(spyReject);
        const endTime = jest.getRealSystemTime();

        expect(endTime-startTime).toBeGreaterThanOrEqual(1000);
        expect(spyDeferReply).toHaveBeenCalled();
        expect(spyEditReply).not.toHaveBeenCalled();
        expect(spyReject).toHaveBeenCalled();
    });

    /**
     * The embed function should reply with two embeds. The first should have the title "Purple Embed", and the second
     * should have the title "Green Embed".
    */
    test("`embed` function defers a reply, then replies with \"Purple Embed\" and \"Green Embed\", respectively", async ()=>{
        const discord = new MockDiscord({ command: "/embed" });

        const interaction = discord.getInteraction() as ChatInputCommandInteraction;
        const spyDeferReply = jest.spyOn(interaction, "deferReply");
        const spyEditReply = jest.spyOn(interaction, "editReply");

        await embed(interaction);

        expect(spyDeferReply).toHaveBeenCalled();

        const message = spyEditReply.mock.calls[0][0] as InteractionEditReplyOptions;

        expect(message.embeds!.length).toEqual(2);

        const embed1 = (message.embeds![0] as EmbedBuilder);
        const embed2 = (message.embeds![1] as EmbedBuilder);

        expect(embed1.data.title!).toMatch(/Purple Embed/);
        expect(embed2.data.title!).toMatch(/Green Embed/);
    });

    /**
     * The tone function should take a message command, defer a reply, and reply with any tone other than the error message
     * "Something went wrong."
    */
    test("`tone` function defers a reply, then replies with something other than \"Something went wrong.\"", async ()=>{
        const discord = new MockDiscord({ command: "/tone" });

        // init interactioncommand
        const message = discord.createMockMessage({
            content: "This is a test message"
        })
        const interaction = discord.createMockMessageCommand("Tone", message);

        // set up spies
        const spyDeferReply = jest.spyOn(interaction, "deferReply");
        const spyEditReply = jest.spyOn(interaction, "editReply");
        (analyzeTone as jest.Mock).mockReturnValue("this message has a TONE tone")

        await tone(interaction);

        expect(spyDeferReply).toHaveBeenCalled();
        expect(spyEditReply).not.toHaveBeenCalledWith("Something went wrong.");
    });

    /**
     * The tone function should take a message command, defer a reply, and reply with the error message
     * "Something went wrong." if an error occurs while parsing tone
     * 
     * The function should then throw the error
    */
    test("`tone` function defers a reply, then replies with \"Something went wrong.\" and throws an error if the tone generation fails", async ()=>{
        // init discord
        const discord = new MockDiscord({ command: "/ping" });

        // init interactioncommand
        const message = discord.createMockMessage({
            content: "This is a test message"
        })
        const interaction = discord.createMockMessageCommand("Tone", message);

        // set up spies
        const spyDeferReply = jest.spyOn(interaction, "deferReply");
        const spyEditReply = jest.spyOn(interaction, "editReply");
        spyEditReply.mockImplementationOnce((message: any): Promise<Message<boolean>> => {
            throw new Error("TEST ERROR");
        });
        (analyzeTone as jest.Mock).mockReturnValue("Unknown error - can't generate the tone at the moment")
        const spyStdErr = jest.spyOn(console, "error");
        spyStdErr.mockImplementation(error => {});

        await tone(interaction);

        expect(spyDeferReply).toHaveBeenCalled();
        expect(spyEditReply).toHaveBeenCalledWith("Something went wrong.");
        expect(spyStdErr).toHaveBeenCalled();
    });

    /**
     * The clarify function should take a message, defer a reply, then reply to only the user who requested clarification.
     *
     * The reply should be "Thanks for pointing that out, I'll ask for you!"
    */
    test("`clarify` function replies with \"Thanks for pointing that out, I'll ask for you!\" to only the caller.", async ()=>{
        const discord = new MockDiscord({ command: "/ping" });

        const message = discord.createMockMessage({
            content: "This is a test message"
        })

        const interaction = discord.createMockMessageCommand("Clarify", message);

        const spyReply = jest.spyOn(interaction, "reply");

        await clarify(interaction);

        expect(spyReply).toHaveBeenCalledWith({
            ephemeral: true,
            content: "Thanks for pointing that out, I'll ask for you!"
        });
    });

    /**
     * The clarify function should take a message, and send a message in the same channel asking the sender for clarification
     * The reply should be formatted as such:
     * 
     * Hey there, <author>! It seems I wasn't able to understand the tone in one of your messages:
     * 
     * > This is what the
     * > original message was,
     * > and it may have multiple lines.
     * 
     * To help me learn, I was hoping you could clarify the tone of your message.
     * Here's a short list of tones: \`<embed>\` (***TODO***)
    */
    test("`clarify` function defers a reply, then replies with the original message in block quotes, with the proper formatting.", async ()=>{
        const discord = new MockDiscord({ command: "/ping" });

        const singleLineMessage = discord.createMockMessage({
            content: "This is a test message"
        });
        const singleLineResponse = `Hey there, <@user-id>! It seems I wasn't able to understand the tone in one of your messages:

> This is a test message

To help me learn, I was hoping you could clarify the tone of your message.
Here's a short list of tones: \`<embed>\` (***TODO***)`;

        const multiLineMessage = discord.createMockMessage({
            content: `This is a
test message`
        });
        const multiLineResponse = `Hey there, <@user-id>! It seems I wasn't able to understand the tone in one of your messages:

> This is a
> test message

To help me learn, I was hoping you could clarify the tone of your message.
Here's a short list of tones: \`<embed>\` (***TODO***)`;

        const singleLineInteraction = discord.createMockMessageCommand("Clarify", singleLineMessage);
        const multiLineInteraction = discord.createMockMessageCommand("Clarify", multiLineMessage);

        await clarify(singleLineInteraction);
        const singleLineLatestMessage = discord.getLatestMessage() as string

        expect(singleLineLatestMessage).toBe(singleLineResponse);

        await clarify(multiLineInteraction);
        const multiLineLatestMessage = discord.getLatestMessage() as string

        expect(multiLineLatestMessage).toBe(multiLineResponse);
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

        const { set: mockSet, get: mockGet } = require('firebase/database') as MockDatabase;
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