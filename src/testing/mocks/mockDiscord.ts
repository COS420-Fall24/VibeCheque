import {
  Client,
  User,
  CommandInteraction,
  MessagePayload,
  InteractionEditReplyOptions,
  Message,
  MessageContextMenuCommandInteraction,
  MessageCreateOptions,
} from "discord.js";

type MockDiscordOptions = {
    command: string
}


export default class MockDiscord {
    private client!: Client;
    private user!: User;
    private interaction!: CommandInteraction;
    private interactionReply!: string | MessagePayload | InteractionEditReplyOptions;

    constructor(options: MockDiscordOptions) {
        this.mockClient();
        this.user = this.createMockUser(this.client);
        this.interaction = this.createMockInteraction(options?.command);
    }

    public getInteraction(): CommandInteraction {
        return this.interaction;
    }

    public getInteractionReply(): string | MessagePayload | InteractionEditReplyOptions {
        return this.interactionReply;
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

    public createMockInteraction(command: string): CommandInteraction {
        return {
            client: this.client,
            user: this.user,
            data: command,
            id: BigInt(1),
            // reply: jest.fn((text: string) => this.interactionReply = text),
            deferReply: jest.fn(),
            editReply: jest.fn((reply: string | MessagePayload | InteractionEditReplyOptions) => this.interactionReply = reply),
            // fetchReply: jest.fn(),
            isRepliable: jest.fn(() => true)
        } as unknown as CommandInteraction;
    }

    public createMockMessageCommand(command: string, message: Message): MessageContextMenuCommandInteraction {
        return {
            ...this.createMockInteraction(command),
            targetMessage: message,
            isMessageContextMenuCommand: jest.fn(() => true)
        } as unknown as MessageContextMenuCommandInteraction
    }

    public createMockMessage(options: MessageCreateOptions): Message {
        return {
            client: this.client,
            author: this.user,
            content: "MESSAGE CONTENT",
            ...options
        } as unknown as Message;
    }
}