import * as discordJS from "discord.js";
import { MockDiscord } from "./testing/mocks/mockDiscord";
import { getTimestampFromSnowflake } from "./helpers";
jest.mock("discord.js");

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

    describe("Testing getTimestampFromSnowflake", () => {
        test("the snowflake '0' should return the Discord Epoch (1420070400000)", () => {
            const inputSnowflake = "0";
            const outputTime = 1420070400000;

            const result = getTimestampFromSnowflake(inputSnowflake);

            expect(result).toBe(outputTime);
        });
    });
}); 