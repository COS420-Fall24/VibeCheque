import * as discordJS from "discord.js";
import * as firebase from "firebase/database";
import { MockDiscord } from "./testing/mocks/mockDiscord";
import { addRoleToDatabase, getTimestampFromSnowflake, removeRoleFromDatabase } from "./helpers";
jest.mock("discord.js");
jest.mock("firebase/database");

describe("Testing helper functions", () => {
    beforeAll(()=>{
        process.env.APP_ID = "TEST APP ID";
        process.env.DISCORD_TOKEN = "TEST TOKEN";
        
        // jest.spyOn(console, "log").mockImplementation(() => {});
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

});