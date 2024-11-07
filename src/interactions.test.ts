import { ping } from "./interactions";
import { mockSlashCommandInteraction } from "./testing/mocks/interaction";

describe("Testing slash commands", ()=>{
	test("Testing the ping function", async ()=>{
		const interaction = mockSlashCommandInteraction("/ping")
		await ping(interaction);
		expect(interaction.fetchReply()).toBe("pong!");
	});
});