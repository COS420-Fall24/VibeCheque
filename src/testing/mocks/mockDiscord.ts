import {
  Client,
  User,
  CommandInteraction,
  MessagePayload,
  InteractionEditReplyOptions,
  Message,
  MessageContextMenuCommandInteraction,
  MessageCreateOptions,
  Guild,
  GuildMember,
  CommandInteractionOptionResolver,
  CacheType,
  CommandInteractionOption,
  UserResolvable,
  GuildMemberManager
} from "discord.js";

type MockDiscordOptions = {
    command: string,
    commandOptions?: {}
}


export default class MockDiscord {
    private client!: Client;
    private user!: User;
    private interaction!: CommandInteraction;
    private interactionReply!: string | MessagePayload | InteractionEditReplyOptions;
    private interactionOptions!: CommandInteractionOption;
    private guild: Guild;
    private guildMember: GuildMember;

    constructor(options: MockDiscordOptions) {
        this.mockClient();
        this.user = this.createMockUser(this.client);
        this.guild = this.createMockGuild(this.client);
        this.guildMember = this.createMockGuildMember(this.client, this.user, this.guild);
        this.interaction = this.createMockInteraction(options?.command, options?.commandOptions);

    }

    public getInteraction(): CommandInteraction {
        return this.interaction;
    }

    public getInteractionReply(): string | MessagePayload | InteractionEditReplyOptions {
        return this.interactionReply;
    }

    public getUser(): User {
        return this.user;
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

    private createMockGuild(client: Client): Guild {
        return {
            client: client,
            id: "guild-id",
            name: "mock guild",
            roles: [],
            members: this.createMockMembers({} as GuildMemberManager),
        } as unknown as Guild
    }

    private createMockGuildMember(client: Client, user: User, guild: Guild): GuildMember {
        return {
            client: client,
            deaf: false,
            mute: false,
            self_mute: false,
            self_deaf: false,
            session_id: "session-id",
            channel_id: "channel-id",
            nick: "nick",
            user: user,
            roles: [],
            guild: guild
        } as unknown as GuildMember
    }

    public createMockInteraction(command: string, options?: {}): CommandInteraction {
        return {
            client: this.client,
            user: this.user,
            guild: this.guild,
            data: command,
            options: this.createMockOptions(options ? options : {}),
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

    public createMockOptions(commandOptions: {}): CommandInteractionOptionResolver{
        return {
            options: commandOptions,
            getString: jest.fn((option: string) => (commandOptions as any)[option])
        } as unknown as CommandInteractionOptionResolver;
    }

    public createMockMembers(members: {}): GuildMemberManager {
        return {
            members: members,
            fetch: jest.fn((user: UserResolvable) => (members as any)[user.toString()])
        } as unknown as GuildMemberManager;
    }
}