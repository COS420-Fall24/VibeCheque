import * as gptRequests from "./gptRequests";
import * as OpenAI from "openai";
jest.mock("openai");

describe("Testing the functionality of gptRequests.ts", ()=>{
    describe("Testing analyzeTone", ()=>{
        /**
         * `gptRequests.ts` should have a function called `analyzeTone` that returns a string of the tone. If the tone is valid,
         * it should not be "Unknown error - can't generate the tone at the moment".
         */
        test("gptRequests.ts should have a function called analyzeTone that returns a string of the tone", async ()=>{
            const userText = "I'm happy";
            const result = await gptRequests.analyzeTone(userText);
            expect(result).toBeDefined();
            expect(result).not.toBe("Unknown error - can't generate the tone at the moment");
        });

        /**
         * `gptRequests.ts` should have a function called `analyzeTone` that returns a string of the tone. If the tone is not valid,
         * it should be "Unknown error - can't generate the tone at the moment".
         */
        test("gptRequests.ts should have a function called analyzeTone that returns 'Unknown error - can't generate the tone at the moment' if the tone is not valid", async ()=>{
            const userText = "I'm happy";

            OpenAI.OpenAI.prototype.chat.completions.create = jest.fn().mockResolvedValue({
                choices: [{ message: { content: null, role: "assistant" } }]
            });

            const result = await gptRequests.analyzeTone(userText);
            expect(result).toBeDefined();
            expect(result).toBe("Unknown error - can't generate the tone at the moment");
        });
    });

    describe("Testing analyzeMoodColor", ()=>{
        /**
         * `gptRequests.ts` should have a function called `analyzeMoodColor` that returns a hex color string without the "#"
         * character (e.g. "123456" instead of "#123456"). If the output is valid, it should not be white.
         */
        test("gptRequests.ts should have a function called analyzeMoodColor that returns a non-white string of 6 hex characters with normal output", async ()=>{
            const mood = "happy";

            OpenAI.OpenAI.prototype.chat.completions.create = jest.fn().mockResolvedValue({
                choices: [{ message: { content: "123456", role: "assistant" } }]
            });

            const result = await gptRequests.analyzeMoodColor(mood);

            expect(result).toBeDefined();
            expect(result.length).toBe(6);
            expect(result).toMatch(/^[0-9a-fA-F]{6}$/);
            expect(result.toLowerCase()).not.toBe("ffffff");
        });

        /**
         * `gptRequests.ts` should have a function called `analyzeMoodColor` that returns the string "ffffff" if the gpt output is not a valid color
         * (e.g. "orange" => "ffffff" since "orange" is not a valid hex color).
         */
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