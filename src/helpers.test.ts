import * as discordJS from "discord.js";
import * as firebase from "firebase/database";
import { MockDiscord } from "./testing/mocks/mockDiscord";
import { getTimestampFromSnowflake } from "./helpers";
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
    });
}); 