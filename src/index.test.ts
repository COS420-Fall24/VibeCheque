import * as mainFile from "./index"
import * as discordApp from "./discordApp"

describe("Testing slash commands", ()=>{
	test("index.ts should run launchBot() from discordApp.ts", async ()=>{

		const spyLaunchBot = jest.spyOn(discordApp, "launchBot");

		await mainFile.main();

		expect(spyLaunchBot).toHaveBeenCalled();
	});
});