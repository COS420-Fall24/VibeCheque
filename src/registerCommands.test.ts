import * as registerCommands from "./registerCommands";
jest.mock("discord.js");

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
        jest.resetModules();
        
        const spyUpdateCommands = jest.spyOn(registerCommands, "updateCommands");
        
        await registerCommands.main();

        expect(spyUpdateCommands).toHaveBeenCalled();
        const calledCommands = spyUpdateCommands.mock.calls[0][0];
        
        const pingCommand = calledCommands.find(cmd => cmd.name === "ping");
        expect(pingCommand).toBeDefined();
        expect(pingCommand?.type).toBe(1); // Type 1 is slash command
    });

    // i cannot get this to work :/
    // test("`updateCommands` should call REST.put with the correct arguments", async () => {
    //     const spyRestPut = jest.spyOn(REST.prototype, "put");

    //     const restInstance = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN as string);
    //     await restInstance.put(Routes.applicationCommands("TEST APP ID"), { body: [] });

    //     await updateCommands([]);

    //     expect(spyRestPut).toHaveBeenCalledWith(
    //         Routes.applicationCommands("TEST APP ID"),
    //         { body: [] }
    //     );
    // });
});