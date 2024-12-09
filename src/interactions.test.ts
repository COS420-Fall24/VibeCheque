import { ChatInputCommandInteraction, EmbedBuilder, Message, MessageComponentBuilder, 
    MessageContextMenuCommandInteraction, MessagePayload, ActionRowBuilder, 
    StringSelectMenuComponent, ActionRow, ButtonComponent } from "discord.js";
import { embed, ping, tone, action, getTones, Tone } from "./interactions";
import MockDiscord from "./testing/mocks/mockDiscord";
import { analyzeTone } from "./gptRequests";
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

        //console.log("interaction: ", interaction);

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

    //Best coverage I can do here, I have no clue how to implement the collector as it requires a lot of set up
    test("`action` function replies with two action rows, one a menu, and the other five buttons.", async () => {
        const discord = new MockDiscord({ command: "/action"});

        const message = discord.createMockMessage({});

        const interaction = discord.getInteraction() as ChatInputCommandInteraction;

        await action(interaction);

        let reply: any = discord.getInteractionReply() as any;

        expect(reply).toHaveProperty("components");
        expect(reply.components).toHaveProperty("length");
        expect(reply.components.length).toBe(2);
        expect(reply.components[0] instanceof ActionRowBuilder).toBeTruthy();
        expect(reply.components[1] instanceof ActionRowBuilder).toBeTruthy();

        const actionRow1 = reply.components[0];
        const actionRow2 = reply.components[1];

        expect(actionRow1.components[0].options[0].data.label).toMatch('Option 1 Label');
        expect(actionRow1.components[0].options[1].data.label).toMatch('Option 2 Label');
        expect(actionRow1.components[0].options[2].data.label).toMatch('Option 3 Label');

        expect(actionRow2.components[0].data.label).toMatch('Primary Button');
        expect(actionRow2.components[1].data.label).toMatch('Secondary Button');
        expect(actionRow2.components[2].data.label).toMatch('Success Button');
        expect(actionRow2.components[3].data.label).toMatch('Danger Button');
        expect(actionRow2.components[4].data.label).toMatch('Link Button');
    });

    //Can only test that the action row builder contains the items we expect
    test("`list-tones` returns a message containing a StringSelectMenu of tones", async () => {
        const discord = new MockDiscord({ command: "/list-tones"});

        const message = discord.createMockMessage({});

        const interaction = discord.getInteraction() as ChatInputCommandInteraction;

        await getTones(interaction);

        let reply: any = discord.getInteractionReply() as any;

        expect(reply).toHaveProperty("components");
        expect(reply.components).toHaveProperty("length");
        expect(reply.components.length).toBe(1);
        expect(reply.components[0] instanceof ActionRowBuilder).toBeTruthy();

        const actionRow = reply.components[0].components[0].options;

        const tones: Tone[] = require("./tones.json").tones;

        tones.forEach((tone: Tone, value: number) => {expect(actionRow[value].data.label).toMatch(`${tone.name}: ${tone.indicator}`)});
    });
});