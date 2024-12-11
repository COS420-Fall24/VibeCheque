import * as discordJS from "discord.js"; 
import { embed, ping, tone, mood, clarify, requestAnonymousClarification } from "./interactions";
import { MockDiscord } from "./testing/mocks/mockDiscord";
import * as gptRequests from "./gptRequests";
jest.mock("./gptRequests")
jest.mock("discord.js");

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
        child: mockChild,
        ref: mockRef,
        set: jest.fn().mockResolvedValue(undefined),
        getDatabase: jest.fn().mockReturnValue({
            ref: mockRef
        })
    };
});

describe("Testing application commands", ()=>{
    beforeAll(()=>{
        process.env.APP_ID = "TEST APP ID";
        process.env.DISCORD_TOKEN = "TEST TOKEN";
        
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    describe("Testing ping command", () => {
        /**
         * The ping function should defer a reply, then respond with "pong!" at least a second later if the interaction
         * is repliable
         */
        test("`ping` function defers a reply, then replies with \"pong!\" after 1000 ms if the interaction is repliable", async ()=>{
            const discord = new MockDiscord({ command: "/ping" });

            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
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

            const interaction = discord.createMockInteraction("/ping", discord.getGuild(), discord.getGuildMember(), false) as discordJS.ChatInputCommandInteraction;
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
    });

    describe("Testing embed command", () => {

        /**
         * The embed function should reply with two embeds. The first should have the title "Purple Embed", and the second
         * should have the title "Green Embed".
        */
        test("`embed` function defers a reply, then replies with \"Purple Embed\" and \"Green Embed\", respectively", async ()=>{
            const discord = new MockDiscord({ command: "/embed" });

            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            const spyDeferReply = jest.spyOn(interaction, "deferReply");
            const spyEditReply = jest.spyOn(interaction, "editReply");

            await embed(interaction);

            expect(spyDeferReply).toHaveBeenCalled();

            const message = spyEditReply.mock.calls[0][0] as discordJS.InteractionEditReplyOptions;

            expect(message.embeds!.length).toEqual(2);

            const embed1 = (message.embeds![0] as discordJS.EmbedBuilder);
            const embed2 = (message.embeds![1] as discordJS.EmbedBuilder);

            expect(embed1.data.title!).toMatch(/Purple Embed/);
            expect(embed2.data.title!).toMatch(/Green Embed/);
        });
    });

    describe("Testing tone command", () => {
            
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
            (gptRequests.analyzeTone as jest.Mock).mockReturnValue("this message has a TONE tone")

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
            spyEditReply.mockImplementationOnce((message: any): Promise<discordJS.Message<boolean>> => {
                throw new Error("TEST ERROR");
            });
            (gptRequests.analyzeTone as jest.Mock).mockReturnValue("Unknown error - can't generate the tone at the moment")
            const spyStdErr = jest.spyOn(console, "error");
            spyStdErr.mockImplementation(error => {});

            await tone(interaction);

            expect(spyDeferReply).toHaveBeenCalled();
            expect(spyEditReply).toHaveBeenCalledWith("Something went wrong.");
            expect(spyStdErr).toHaveBeenCalled();
        });
    });

    describe("Testing clarify command", () => {
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
    });
    
    describe("Testing mood command", () => {
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

            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            
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
                "mock-ref",
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

            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            
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
                exists: () => false,
                val: () => null
            });

            await mood(interaction);

            // Check that the array of calls includes our expected call
            expect(mockSet.mock.calls).toContainEqual([
                "mock-ref",
                {
                    mood: "excited",
                    timestamp: 1234567890
                }
            ]);
        });

        /**
         * the mood command should print an error to stderr if the mood is not found in the database
         */
        test("`mood` command prints an error to stderr if the mood is not found in the database", async () => {
            const discord = new MockDiscord({ 
                command: "/mood", 
                commandOptions: { currentmood: "excited" }
            });

            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            const error = new Error("TEST ERROR");
            
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
            mockGet.mockRejectedValue(error);

            const spyStdErr = jest.spyOn(console, "error").mockImplementation(() => {});

            await mood(interaction);

            // Check that the array of calls includes our expected call
            expect(spyStdErr).toHaveBeenCalledWith(error);
        });
    });

    describe("Testing requestAnonymousClarification command", () => {
        // Debugging
        // console.log("Describe block is being executed.");
    
        /**
         * The requestAnonymousClarification function should defer a reply, then reply with "Your request for anonymous clarification has been sent."
         * 
         * The function should then send an anonymous request to the target message author.
         * 
         * The request should be formatted as such:
         * 
         * You've received an anonymous request for clarification on your message: "This is the body of the message that needs clarification" Will you clarify your tone?
         */
        test("`requestAnonymousClarification` command should defer the reply and send an anonymous request to the target message author", async () => {
            // Debugging
            // console.log("Test is being executed.");
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

        /**
         * The requestAnonymousClarification function should listen for a response from the target message author
         * 
         * The function should then analyze the tone of the response, and respond to the requester with "Requested Tone Clarification: Selected Tone"
         */
        test("`requestAnonymousClarification` command listens for a response from the target message author, and responds with \"Requested Tone Clarification: Selected Tone\" and stops the collector", async ()=>{
            const discord = new MockDiscord({ command: "Request Clarification" });

            const testMessage = "This is a test message";
            const testTone = "test tone";
            const expectedResponse = `Requested Tone Clarification: "${testTone}"`;

            const mockMessage = discord.createMockMessageWithDM();
            const interaction = discord.createMockMessageCommand("Request Clarification", mockMessage);

            const spyCollector = jest.spyOn(mockMessage.author.dmChannel!, "createMessageCollector");
            const collector = new discordJS.MessageCollector(mockMessage.author.dmChannel!);
            spyCollector.mockReturnValue(collector);

            const spyCollectorOn = jest.spyOn(collector, "on");

            await requestAnonymousClarification(interaction);

            expect(spyCollector).toHaveBeenCalled();
            expect(spyCollectorOn).toHaveBeenCalledWith("collect", expect.any(Function));

            // Get the collect callback
            const collectCallback: Function = spyCollectorOn.mock.calls.find(call => call[0] === "collect" && call[1] !== undefined)?.[1] as Function;

            (gptRequests.analyzeTone as jest.Mock).mockResolvedValue(testTone);

            // Call the collect callback with the test tone
            await collectCallback(testMessage);

            expect(interaction.user.send).toHaveBeenCalledWith(expectedResponse);

            expect(collector.stop).toHaveBeenCalled();
        });

        /**
         * The requestAnonymousClarification function should listen for a response from the target message author. if no response is received (the end event is called with reason "time"),
         * the function should respond with "The user did not respond in time."
         */
        test("`requestAnonymousClarification` command listens for a response from the target message author, and responds with \"The user did not respond in time.\" if no response is received within the time limit", async ()=>{
            const discord = new MockDiscord({ command: "Request Clarification" });

            const expectedResponse = "The user did not respond in time.";

            const mockMessage = discord.createMockMessageWithDM();
            const interaction = discord.createMockMessageCommand("Request Clarification", mockMessage);

            const spyCollector = jest.spyOn(mockMessage.author.dmChannel!, "createMessageCollector");
            const collector = new discordJS.MessageCollector(mockMessage.author.dmChannel!);
            spyCollector.mockReturnValue(collector);

            const spyCollectorOn = jest.spyOn(collector, "on");

            await requestAnonymousClarification(interaction);

            expect(spyCollector).toHaveBeenCalled();
            expect(spyCollectorOn).toHaveBeenCalledWith("end", expect.any(Function));

            // Get the collect callback
            const endCallback: Function = spyCollectorOn.mock.calls.find(call => call[0] === "end" && call[1] !== undefined)?.[1] as Function;

            // Call the collect callback with the test tone
            await endCallback(new discordJS.Collection(), "time");

            expect(interaction.user.send).toHaveBeenCalledWith(expectedResponse);
        });

        /**
         * The requestAnonymousClarification function should attempt to send a message to the target message author,
         * and respond with "There was an error handling the clarification request" if the message fails to send
         */
        test("`requestAnonymousClarification` command attempts to send a message to the target message author, and responds with \"There was an error handling the clarification request\" if the message fails to send", async ()=>{
            const discord = new MockDiscord({ command: "Request Clarification" });

            const mockMessage = discord.createMockMessageWithDM();
            const interaction = discord.createMockMessageCommand("Request Clarification", mockMessage);

            const spySend = jest.spyOn(mockMessage.author, "send");
            spySend.mockRejectedValue(new Error("TEST ERROR"));

            const spyEditReply = jest.spyOn(interaction, "editReply");

            await requestAnonymousClarification(interaction);

            expect(spyEditReply.mock.calls[0][0]).toHaveProperty("content", "There was an error handling the clarification request");
        });
    });
});