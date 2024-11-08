import {
  Client,
  User,
  CommandInteraction,
} from "discord.js";

type MockDiscordOptions = {
    command: string
}


export default class MockDiscord {
    private client!: Client;
    private user!: User;
    private interaction!: CommandInteraction;
    private interactionReply!: string;

    constructor(options: MockDiscordOptions) {
        this.mockClient();
        this.user = this.createMockUser(this.client);
        this.interaction = this.createMockInteraction(this.client, this.user, options?.command);
    }

    public getInteraction(): CommandInteraction {
        return this.interaction;
    }

    private mockClient(): void {
        this.client = new Client({ intents: [] });
        this.client.login = jest.fn(() => Promise.resolve("LOGIN_TOKEN"));
    }

    private createMockUser(client: Client): User{
        return {
            client: client,
            id: "user-id",
            username: "USERNAME",
            discriminator: "user#0000",
            avatar: "user avatar url",
            bot: false
        } as User
    }

    private createMockInteraction(client: Client, user: User, command: string): CommandInteraction {
        return {
            client: client,
            user: user,
            data: command,
            id: BigInt(1),
            // reply: jest.fn((text: string) => this.interactionReply = text),
            deferReply: jest.fn(),
            editReply: jest.fn((text: string) => this.interactionReply = text),
            fetchReply: jest.fn((): string => this.interactionReply),
            isRepliable: jest.fn(() => true)
        } as unknown as CommandInteraction;
    }
}