const openAI = jest.requireActual<typeof import("openai")>("openai");
const mockOpenAI = jest.createMockFromModule<typeof import("openai")>("openai");

class MockOpenAIObject extends openAI.OpenAI {
    constructor() {
        super();
        this.chat = MockOpenAIObject.prototype.chat;
    }
}

MockOpenAIObject.prototype.chat = {
    // @ts-ignore
    completions: {
        create: jest.fn().mockResolvedValue({
            id: 'test-id',
            created: 1234567890,
            model: 'test-model',
            object: 'chat.completion',
            choices: [{ message: { content: "123456", role: "assistant" } }]
        })
    }
};

mockOpenAI.OpenAI = MockOpenAIObject;
module.exports = mockOpenAI;