import * as gptRequests from "./gptRequests";
import * as OpenAI from "openai";
jest.mock("openai");

describe("Testing the functionality of gptRequests.ts", ()=>{
    test("gptRequests.ts should have a function called analyzeTone", ()=>{
        expect(gptRequests.analyzeTone).toBeDefined();
    });

    describe("Testing analyzeMoodColor", ()=>{
        test("gptRequests.ts should have a function called analyzeMoodColor that returns a non-white string of 6 hex characters with normal output", async ()=>{
            const mood = "happy";

            const result = await gptRequests.analyzeMoodColor(mood);

            expect(result).toBeDefined();
            expect(result.length).toBe(6);
            expect(result).toMatch(/^[0-9a-fA-F]{6}$/);
            expect(result.toLowerCase()).not.toBe("ffffff");
        });

        test("gptRequests.ts should have a function called analyzeMoodColor that returns white if the gpt output is not a valid color", async ()=>{
            const mood = "happy";
            OpenAI.OpenAI.prototype.chat.completions.create = jest.fn().mockResolvedValue({
                choices: [{ message: { content: "some invalid color", role: "assistant" } }]
            });

            const result = await gptRequests.analyzeMoodColor(mood);

            expect(result).toBeDefined();
            expect(result.toLowerCase()).toBe("ffffff");
        });
    });
});