import * as registerCommands from "./registerCommands";
import * as discordJS from "discord.js";
jest.mock("discord.js");

describe("Testing the functionality of \"registerCommands.ts\"", ()=>{
    beforeAll(()=>{
        process.env.APP_ID = "TEST APP ID";
        process.env.DISCORD_TOKEN = "TEST TOKEN";
        
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    /**
     * In main, updateCommands should be called with at least the following commands:
     * ping: slash command
     * Tone: message command
     * Clarify: message command
     */
    test("`main` should call updateCommands with a ping message command", async ()=>{
        const spyUpdateCommands = jest.spyOn(registerCommands, "updateCommands");
        
        await registerCommands.main();

        expect(spyUpdateCommands).toHaveBeenCalled();
        const calledCommands = spyUpdateCommands.mock.calls[0][0];
        
        const pingCommand = calledCommands.find(cmd => cmd.name === "ping");
        expect(pingCommand).toBeDefined();
        expect(pingCommand?.type).toBe(discordJS.ApplicationCommandType.ChatInput);
    });
    /**
     * `updateCommands` should print the app id and throw an error if the REST.put call fails
     */
    test("`updateCommands` should print the app id and throw an error if the REST.put call fails", async () => {
        const spyRestPut = jest.spyOn(discordJS.REST.prototype, "put");
        spyRestPut.mockRejectedValue(new Error("TEST ERROR"));

        await expect(registerCommands.updateCommands([])).rejects.toThrow("TEST ERROR");
    });

    // i cannot get this to work :/
    test("`updateCommands` should call REST.put with the correct arguments", async () => {
        const spyRestPut = jest.spyOn(discordJS.REST.prototype, "put");
        spyRestPut.mockResolvedValue({});

        await registerCommands.updateCommands([]);

        expect(spyRestPut).toHaveBeenCalledWith(
            `/applications/${process.env.APP_ID}/commands`,
            { body: [] }
        );
    });
});