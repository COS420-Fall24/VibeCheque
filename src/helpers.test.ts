import * as discordJS from "discord.js";
import * as firebase from "firebase/database";
import { MockDiscord } from "./testing/mocks/mockDiscord";
import { addRoleToDatabase, cleanupMoods, getTimestampFromSnowflake, MINIMUM_MOOD_LIFESPAN, removeRoleFromDatabase, removeRoleIfUnused, timestampToSnowflake } from "./helpers";
jest.mock("discord.js");
jest.mock("firebase/database");

describe("Testing helper functions", () => {
    beforeAll(()=>{
        process.env.APP_ID = "TEST APP ID";
        process.env.DISCORD_TOKEN = "TEST TOKEN";
        
        // jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    describe("Testing getTimestampFromSnowflake", () => {
        test("the snowflake '0' should return the Discord Epoch (1420070400000)", () => {
            const inputSnowflake = "0";
            const outputTime = 1420070400000;

            const result = getTimestampFromSnowflake(inputSnowflake);

            expect(result).toBe(outputTime);
        });

        test("the snowflake '175928847299117063' should return 2016-04-30 11:18:25.796 UTC (1462015105796)", () => {
            const inputSnowflake = "175928847299117063";
            const outputTime = 1462015105796;

            const result = getTimestampFromSnowflake(inputSnowflake);

            expect(result).toBe(outputTime);
        });
    });

    describe("Testing timestampToSnowflake", () => {
        test("the Discord Epoch (1420070400000) should return the snowflake '0'", () => {
            const inputTime = 1420070400000;
            const outputSnowflake = "0";

            const result = timestampToSnowflake(inputTime);

            expect(result).toBe(outputSnowflake);
        });

        test("the time 2016-04-30 11:18:25.796 UTC (1462015105796) should return the snowflake '175928847298985984'", () => {
            const inputTime = 1462015105796;
            const outputSnowflake = "175928847298985984";

            const result = timestampToSnowflake(inputTime);

            expect(result).toBe(outputSnowflake);
        });
    });

    describe("Testing addRoleToDatabase", () => {
        test("addRoleToDatabase should set servers/[guild id]/roles/[role name] to the role id", async () => {
            const role = { name: "role-name", id: "role-id" } as unknown as discordJS.Role;
            const guildId = "guild-id";

            const mockSet = jest.spyOn(firebase, "set");

            const result = await addRoleToDatabase(guildId, role);

            expect(mockSet).toHaveBeenCalled();
            expect(mockSet.mock.calls[0][0]).toBe(`servers/${guildId}/roles/${role.name}`);
            expect(mockSet.mock.calls[0][1]).toBe(role.id);

            expect(result).toBe("role successfully set");
        });

        test("addRoleToDatabase should return \"something went wrong\" if `set` fails", async () => {
            const role = { name: "role-name", id: "role-id" } as unknown as discordJS.Role;
            const guildId = "guild-id";

            const mockSet = jest.spyOn(firebase, "set");
            mockSet.mockRejectedValueOnce(undefined);

            const result = await addRoleToDatabase(guildId, role);

            expect(mockSet).toHaveBeenCalled();

            expect(result).toBe("something went wrong");
        });
    });

    describe("Testing removeRoleFromDatabase", () => {
        test("removeRoleFromDatabase should remove servers/[guild id]/roles/[role name] from the database", async () => {
            const role = { name: "role-name", id: "role-id" } as unknown as discordJS.Role;
            const guildId = "guild-id";

            const mockRemove = jest.spyOn(firebase, "remove");

            const result = await removeRoleFromDatabase(guildId, role);

            expect(mockRemove).toHaveBeenCalled();
            expect(mockRemove.mock.calls[0][0]).toBe(`servers/${guildId}/roles/${role.name}`);

            expect(result).toBe("role successfully removed");
        });

        test("removeRoleFromDatabase should return \"something went wrong\" if `remove` fails", async () => {
            const role = { name: "role-name", id: "role-id" } as unknown as discordJS.Role;
            const guildId = "guild-id";

            const mockRemove = jest.spyOn(firebase, "remove");
            mockRemove.mockRejectedValueOnce(undefined);

            const result = await removeRoleFromDatabase(guildId, role);

            expect(mockRemove).toHaveBeenCalled();

            expect(result).toBe("something went wrong");
        });
    });


    describe("Testing removeRoleIfUnused", () => {
        test("removeRoleIfUnused should return \"Invalid role specified\" if `role` is null", async () => {
            const role = null;
            const expectedResponse = "Invalid role specified";

            const result = await removeRoleIfUnused(role);

            expect(result).toBe(expectedResponse);
        });

        test("removeRoleIfUnused should return \"role is too young to be removed\" if `role` has not existed for long enough", async () => {
            const role = { name: "role-name", id: timestampToSnowflake(1462015105796 - (MINIMUM_MOOD_LIFESPAN - 1000)) } as unknown as discordJS.Role;
            const expectedResponse = "role is too young to be removed";

            const now = jest.spyOn(Date, "now");
            now.mockReturnValue(1462015105796);

            const result = await removeRoleIfUnused(role);

            expect(result).toBe(expectedResponse);
        });

        test("removeRoleIfUnused should return \"role removed\" if `role` has no users", async () => {
            const discord = new MockDiscord({ command: "" });

            discord.addRoleToGuild("role-name", "000000");

            const role = discord.getRoles().find((storedRole) => storedRole.name === "role-name") as unknown as discordJS.Role;
            const expectedResponse = "role removed";

            const now = jest.spyOn(Date, "now");
            now.mockReturnValue(1420070400000 + (MINIMUM_MOOD_LIFESPAN + 1000));

            const result = await removeRoleIfUnused(role);

            expect(result).toBe(expectedResponse);
        });

        test("removeRoleIfUnused should return \"role still in use\" if `role` is being used by another user", async () => {
            const discord = new MockDiscord({ command: "" });

            discord.addRoleToGuild("role-name", "000000");

            const role = discord.getRoles().find((storedRole) => storedRole.name === "role-name") as unknown as discordJS.Role;
            discord.addRoleToMember(role.id);
            
            const expectedResponse = "role still in use";

            const now = jest.spyOn(Date, "now");
            now.mockReturnValue(1420070400000 + (MINIMUM_MOOD_LIFESPAN + 1000));

            const result = await removeRoleIfUnused(role);

            expect(result).toBe(expectedResponse);
        });
    });

    describe("Testing cleanupMoods", () => {
        test("cleanupMoods should return \"Bot does not have access to the specified guild\" if fetching the guild throws an error", async () => {
            const discord = new MockDiscord({ command: "" });
            const guildId = "0";
            const expectedResponse = "Bot does not have access to the specified guild";

            const mockFetch = jest.spyOn(discord.getUser().client.guilds, "fetch");
            mockFetch.mockRejectedValue("mock-err")

            const result = await cleanupMoods(discord.getUser().client, guildId);

            expect(result).toBe(expectedResponse);
        });
    });
});