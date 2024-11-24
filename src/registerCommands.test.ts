// import { REST } from "discord.js";
import { updateCommands, main } from "./registerCommands";
// jest.mock("discord.js");

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
        // console.log(REST);
        // const spyRestPut = jest.spyOn(REST.prototype, "put");

        // const restInstance = new REST();
        // restInstance.put("/");
        
        // await updateCommands([]);

        // expect(spyRestPut).toHaveBeenCalled();
    });
});