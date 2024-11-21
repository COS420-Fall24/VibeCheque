import { ChatInputCommandInteraction, EmbedBuilder, Message, MessageComponentBuilder, MessageContextMenuCommandInteraction, MessagePayload } from "discord.js";
import { clarify, embed, ping, tone } from "./interactions";
import MockDiscord from "./testing/mocks/mockDiscord";
import analyzeTone from "./gptRequests";
jest.mock("./gptRequests")

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
        const discord = new MockDiscord({ command: "/ping" });

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

    /*
     * The clarify function should take a message, defer a reply, then reply to only the user who requested clarification.
     *
     * The reply should be "Thanks for pointing that out, I'll ask for you!"
    **/
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

    /*
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
    **/
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