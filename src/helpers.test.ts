import * as discordJS from "discord.js";
import { MockDiscord } from "./testing/mocks/mockDiscord";
import { updateOldRoleInServer, removeOldRoleInServer, updateNewRoleInServer } from "./helpers";

type MockDatabase = {
    get: jest.Mock;
    child: jest.Mock;
    ref: jest.Mock;
    set: jest.Mock;
    remove: jest.Mock;
    getDatabase: jest.Mock;
}

jest.mock('firebase/database', (): MockDatabase => {
    const mockSnapshot = {
        exists: () => true,
        val: () => ({ count: 2 })
    };
    
    const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
    const mockChild = jest.fn((_, path) => {
        return `servers/${path}`;
    });
    const mockRef = jest.fn().mockReturnValue('mock-ref');
    const mockSet = jest.fn().mockResolvedValue(undefined);
    const mockRemove = jest.fn().mockResolvedValue(undefined);

    return {
        get: mockGet,
        child: mockChild,
        ref: mockRef,
        set: mockSet,
        remove: mockRemove,
        getDatabase: jest.fn().mockReturnValue({
            ref: mockRef
        })
    };
});

describe("Testing helper functions", () => {
    beforeAll(()=>{
        process.env.APP_ID = "TEST APP ID";
        process.env.DISCORD_TOKEN = "TEST TOKEN";
        
        jest.spyOn(console, "log").mockImplementation(() => {});
    });
    
    describe("Testing updateOldRoleInServer", () => {
        test("returns 'No role specified' when roleName is empty, null, or undefined", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;

            expect(await updateOldRoleInServer(interaction, "")).toBe("No role specified");
            expect(await updateOldRoleInServer(interaction, undefined)).toBe("No role specified");
        });

        test("returns 'No server found' when guild is null", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            Object.defineProperty(interaction, 'guild', { value: null });

            expect(await updateOldRoleInServer(interaction, "test-role")).toBe("No server found");
        });

        test("prints \"No data available when getting role\" when role does not exist", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;

            const { get: mockGet } = require('firebase/database') as MockDatabase;
            mockGet.mockResolvedValueOnce({
                exists: () => false,
                val: () => null
            });

            const spyConsole = jest.spyOn(console, "log");

            await updateOldRoleInServer(interaction, "test-role");

            expect(spyConsole).toHaveBeenCalledWith("No data available when getting role");
        });

        test("prints error when getting role fails", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;

            const error = new Error("TEST ERROR");

            const spyConsoleError = jest.spyOn(console, "error").mockImplementationOnce(() => {}); // Mock implementation to prevent actual error printing
            
            const { get: mockGet } = require('firebase/database') as MockDatabase;
            mockGet.mockRejectedValueOnce(error);


            await updateOldRoleInServer(interaction, "test-role");

            expect(spyConsoleError).toHaveBeenCalledWith(error);
        });

        test("decreases role count when count > 1", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            
            const { set: mockSet } = require('firebase/database') as MockDatabase;

            const result = await updateOldRoleInServer(interaction, "test-role");

            expect(result).toBe("Decreased role count");
            expect(mockSet).toHaveBeenCalledWith("mock-ref", { count: 1 });
        });

        test("removes role when count = 1", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            
            const { get: mockGet } = require('firebase/database') as MockDatabase;
            mockGet.mockResolvedValueOnce({
                exists: () => true,
                val: () => ({ count: 1 })
            });

            const mockRoleDelete = jest.fn();

            discord.addRoleToGuild("test-role", "000000");

            jest.spyOn(discord.getRoles(), "find").mockReturnValueOnce({
                delete: mockRoleDelete
            });

            const result = await updateOldRoleInServer(interaction, "test-role");

            expect(result).toBe("Removed role");
            expect(mockRoleDelete).toHaveBeenCalled();
        });
    });

    describe("Testing removeOldRoleInServer", () => {
        test("returns 'No role specified' when roleName is empty, null, or undefined", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;

            expect(await removeOldRoleInServer(interaction, "")).toBe("No role specified");
            expect(await removeOldRoleInServer(interaction, undefined)).toBe("No role specified");
        });

        test("returns 'No server found' when guild is null", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            Object.defineProperty(interaction, 'guild', { value: null });

            expect(await removeOldRoleInServer(interaction, "test-role")).toBe("No server found");
        });

        test("removes role from server and database", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            
            discord.addRoleToGuild("test-role", "000000");
            
            const { remove: mockRemove } = require('firebase/database') as MockDatabase;

            const mockRoleDelete = jest.fn();

            jest.spyOn(discord.getRoles(), "find").mockReturnValueOnce({
                delete: mockRoleDelete
            });

            const result = await removeOldRoleInServer(interaction, "test-role");

            expect(result).toBe("Removed role");
            expect(mockRemove).toHaveBeenCalledWith("mock-ref");
            expect(mockRoleDelete).toHaveBeenCalled();
        });
    });

    describe("Testing updateNewRoleInServer", () => {
        test("returns 'No role specified' when roleName is empty, null, or undefined", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;

            expect(await updateNewRoleInServer(interaction, "")).toBe("No role specified");
            expect(await updateNewRoleInServer(interaction, undefined)).toBe("No role specified");
        });

        test("returns 'No server found' when guild is null", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            Object.defineProperty(interaction, 'guild', { value: null });

            expect(await updateNewRoleInServer(interaction, "test-role")).toBe("No server found");
        });

        test("prints error when getting role fails", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;

            const error = new Error("TEST ERROR");

            const spyConsoleError = jest.spyOn(console, "error").mockImplementationOnce(() => {}); // Mock implementation to prevent actual error printing
            
            const { get: mockGet } = require('firebase/database') as MockDatabase;
            mockGet.mockRejectedValueOnce(error);

            await updateNewRoleInServer(interaction, "test-role");

            expect(spyConsoleError).toHaveBeenCalledWith(error);
        });

        test("increments existing role count", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            
            const { set: mockSet } = require('firebase/database') as MockDatabase;

            const result = await updateNewRoleInServer(interaction, "test-role");

            expect(result).toBe("Updated role count");
            expect(mockSet).toHaveBeenCalledWith("mock-ref", { count: 3 });
        });

        test("creates new role with count 1 when role doesn't exist", async () => {
            const discord = new MockDiscord({ command: "/mood" });
            const interaction = discord.getInteraction() as discordJS.ChatInputCommandInteraction;
            
            const { get: mockGet, set: mockSet } = require('firebase/database') as MockDatabase;
            mockGet.mockResolvedValueOnce({
                exists: () => false,
                val: () => null
            });

            const result = await updateNewRoleInServer(interaction, "test-role");

            expect(result).toBe("Updated role count");
            expect(mockSet).toHaveBeenCalledWith("mock-ref", { count: 1 });
        });
    });
}); 