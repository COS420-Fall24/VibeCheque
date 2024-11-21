import {
  Client,
  User,
  CommandInteraction,
  MessagePayload,
  InteractionEditReplyOptions,
  Message,
  MessageContextMenuCommandInteraction,
  MessageCreateOptions,
  Channel,
} from "discord.js";

type MockDiscordOptions = {
    command: string
}


export default class MockDiscord {
    private client!: Client;
    private user!: User;
    private channel!: Channel;
    private interaction!: CommandInteraction;
    private interactionReply!: string | MessagePayload | InteractionEditReplyOptions;
    private latestMessage!: string | MessagePayload;

    constructor(options: MockDiscordOptions) {
        this.mockClient();
        this.mockChannel(this.client);
        this.user = this.createMockUser(this.client);
        this.interaction = this.createMockInteraction(options?.command);
    }

    public getInteraction(): CommandInteraction {
        return this.interaction;
    }

    public getInteractionReply(): string | MessagePayload | InteractionEditReplyOptions {
        return this.interactionReply;
    }

    public getLatestMessage(): string | MessagePayload {
        return this.latestMessage;
    }

    private mockClient(): void {
        this.client = new Client({ intents: [] });
        this.client.login = jest.fn(() => Promise.resolve("LOGIN_TOKEN"));
    }

    private mockChannel(client: Client): void {
        this.channel = {
            client: client,
            id: "channel-id",
            isSendable: jest.fn(() => true),
            send: jest.fn((s: string | MessagePayload) => this.latestMessage = s)
        } as unknown as Channel;
    }

    private createMockUser(client: Client): User{
        let mockUser: User = {
            client: client,
            id: "user-id",
            string: "user-id",
            toString: jest.fn(() => "<@user-id>"),
            username: "USERNAME",
            discriminator: "user#0000",
            avatar: "user avatar url",
            bot: false
        } as unknown as User
        return mockUser;
    }

    public createMockInteraction(command: string): CommandInteraction {
        return {
            client: this.client,
            user: this.user,
            channel: this.channel,
            data: command,
            id: BigInt(1),
            reply: jest.fn((text: string) => this.interactionReply = text),
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