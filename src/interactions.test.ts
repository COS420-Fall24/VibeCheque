import { ChatInputCommandInteraction } from "discord.js";
import { ping } from "./interactions";
import MockDiscord from "./testing/mocks/mockDiscord";

let discord: MockDiscord;

// initialize our mock of discord for these tests
beforeAll(()=>{
    discord = new MockDiscord({command: "/ping"});
})

describe("Testing slash commands", ()=>{
    test("Testing the ping function", async ()=>{
        const discord = new MockDiscord({ command: "/ping" });

        const interaction = discord.getInteraction() as ChatInputCommandInteraction;
        await ping(interaction);
        const spy = jest.spyOn(interaction, "isRepliable");
        expect(spy).toHaveBeenCalled();
        expect(interaction.fetchReply()).toBe("pong!");
    });
});