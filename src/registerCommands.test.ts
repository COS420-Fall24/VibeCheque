import { updateCommands, main } from "./registerCommands";

describe("Testing the functionality of \"registerCommands.ts\"", ()=>{
    beforeAll(()=>{
        process.env.APP_ID = "TEST APP ID";
        process.env.DISCORD_TOKEN = "TEST TOKEN";
    });

    /**
     * In main, updateCommands should be called with at least the following commands:
     * ping: slash command
     * Tone: message command
     * Clarify: message command
     */
    test("`main` should call updateCommands with a ping message command", async ()=>{
        // jest.spyOn()
        await main();
    });
});