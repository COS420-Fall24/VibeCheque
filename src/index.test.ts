import * as mainFile from "./index"
import * as discordApp from "./discordApp"

describe("Testing slash commands", ()=>{
	beforeAll(()=>{
        process.env.APP_ID = "TEST APP ID";
        process.env.DISCORD_TOKEN = "TEST TOKEN";
        
        jest.spyOn(console, "log").mockImplementation(() => {});
    });
	
	test("index.ts should run launchBot() from discordApp.ts", async ()=>{

		const spyLaunchBot = jest.spyOn(discordApp, "launchBot");

		await mainFile.main();

		expect(spyLaunchBot).toHaveBeenCalled();
	});
});