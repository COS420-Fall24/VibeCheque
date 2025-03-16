import {
  Client,
  User,
  PartialDMChannel,
  CommandInteraction,
  MessagePayload,
  InteractionEditReplyOptions,
  Message,
  MessageContextMenuCommandInteraction,
  MessageCreateOptions,
  Channel,
  REST,
  ComponentType,
  InteractionCollector,
  Guild,
  GuildMember,
  CommandInteractionOptionResolver,
  CacheType,
  CommandInteractionOption,
  UserResolvable,
  GuildMemberManager,
  Collection,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  MessageCollector,
  UserFlags
} from "discord.js";

type MockDiscordOptions = {
    command: string,
    commandOptions?: {}
}

export class MockDiscord {
    private client!: Client;
    private user!: User;
    private channel!: Channel;
    private interaction!: CommandInteraction;
    private interactionReply!: string | MessagePayload | InteractionEditReplyOptions;
    private latestMessage!: string | MessagePayload;
    private interactionOptions!: CommandInteractionOption;
    private guild: Guild;
    private guildMember: GuildMember;
    private roles: Collection<string, any>;
    private memberRoles: Collection<string, any>;

    constructor(options: MockDiscordOptions) {
        this.memberRoles = new Collection();
        this.roles = new Collection();
        
        this.mockClient();
        this.mockChannel(this.client);
        this.user = this.createMockUser(this.client);
        
        // Create guildMember first
        this.guildMember = {
            client: this.client,
            deaf: false,
            mute: false,
            self_mute: false,
            self_deaf: false,
            session_id: "session-id",
            channel_id: "channel-id",
            nickname: "nick",
            user: this.user,
            roles: {
                cache: this.memberRoles,
                add: jest.fn().mockImplementation((role: any) => {
                    if (typeof role === 'string') {
                        const roleObj = this.roles.get(role);
                        if (roleObj) {
                            this.memberRoles.set(roleObj.id, roleObj)
                        } else {
                            const newRole = { 
                                id: `${role}-role-id`, 
                                name: role,
                                color: 0x000000
                            }
                            this.guild.roles.create(newRole);
                            this.memberRoles.set(role, newRole)
                        }             
                    } else {
                        this.memberRoles.set(role.id, role);
                    }
                    return Promise.resolve(this.guildMember);
                }),
                remove: jest.fn().mockImplementation((role: any) => {
                    if (typeof role === 'string') {
                        this.memberRoles.delete(role);
                    } else {
                        this.memberRoles.forEach((value, key) => {
                            if (value.id === role.id) {
                                this.memberRoles.delete(key);
                            }
                        });
                    }
                    return Promise.resolve(this.guildMember);
                })
            }
        } as unknown as GuildMember;

        // Then create guild with reference to guildMember
        this.guild = {
            client: this.client,
            id: "guild-id",
            name: "mock guild",
            roles: {
                cache: this.roles,
                create: jest.fn().mockImplementation((options: any) => {
                    // console.log("create role called with options: " + options.name + " " + options.color);
                    const newRole = { 
                        id: `${options.name}-role-id`, 
                        name: options.name,
                        color: options.color || 0x000000
                    };
                    this.roles.set(newRole.id, newRole);
                    // console.log("found role:", JSON.stringify(this.roles.find(role => role.name === "happy")));
                    return Promise.resolve(newRole);
                })
            },
            members: {
                cache: new Map([[this.user.id, this.guildMember]]),
                fetch: jest.fn().mockResolvedValue(this.guildMember)
            }
        } as unknown as Guild;

        // Set guild reference in guildMember
        this.guildMember.guild = this.guild;

        this.interaction = this.createMockInteraction(options.command, this.guild, this.guildMember, true, options.commandOptions);
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
    
    public getUser(): User {
        return this.user;
    }

    public getGuild(): Guild {
        return this.guild;
    }

    public getGuildMember(): GuildMember {
        return this.guildMember;
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
            send: jest.fn((s: string | MessagePayload | MessageCreateOptions) => {
                
                if (typeof s == "string") {
                    this.latestMessage = s;
                    return Promise.resolve(this.createMockMessage({content: s}));
                } else if (s instanceof MessagePayload) {
                    this.latestMessage = s;
                    return Promise.resolve(this.createMockMessage({content: s.makeContent()}));
                } else {
                    this.latestMessage = s.content!;
                    return Promise.resolve(this.createMockMessage(s));
                }
            })
        } as unknown as Channel;
    }

    private createMockUser(client: Client): User{
        let mockUser: User = {
            client: client,
            id: "user-id",
            string: "user-id",
            toString: jest.fn(() => "<@user-id>"),
            send: jest.fn(),
            username: "USERNAME",
            discriminator: "user#0000",
            avatar: "user avatar url",
            bot: false,
            flags: UserFlags.ActiveDeveloper
        } as unknown as User
        return mockUser;
    }

    private createMockGuild(client: Client): Guild {
        return {
            client: client,
            id: "guild-id",
            name: "mock guild",
            roles: {
                cache: this.roles,
                create: jest.fn().mockImplementation((options: any) => {
                    const newRole = { id: `${options.name}-role-id`, name: options.name };
                    this.roles.set(options.name, newRole);
                    return Promise.resolve(newRole);
                })
            },
            members: {
                cache: new Map(),
                fetch: jest.fn().mockImplementation((userId: string) => {
                    return Promise.resolve(this.guildMember);
                })
            },
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
            roles: {
                cache: this.memberRoles,
                add: jest.fn().mockImplementation((role) => {
                    this.memberRoles.set(role.id, role);
                    return Promise.resolve(this);
                }),
                remove: jest.fn().mockImplementation((role) => {
                    this.memberRoles.delete(role.id);
                    return Promise.resolve(this);
                })
            },
            guild: guild
        } as unknown as GuildMember
    }

    public createMockInteraction(command: string, mockGuild: any, mockMember: any, repliable: boolean = true, options: {} = {}): CommandInteraction {
        return {
            client: this.client,
            user: this.user,
            channel: this.channel,
            guild: mockGuild,
            data: command,
            commandName: command,
            options: this.createMockOptions(options ? options : {}),
            id: BigInt(1),
            reply: jest.fn((replyOptions: string | MessagePayload | InteractionReplyOptions) => {
                this.interactionReply = replyOptions;
                return Promise.resolve(this.createMockMessage(replyOptions as MessageCreateOptions));
            }),
            deferReply: jest.fn(),
            editReply: jest.fn((reply: string | MessagePayload | InteractionEditReplyOptions) => {
                this.interactionReply = reply;
                return Promise.resolve(this.createMockMessage(reply as MessageCreateOptions));
            }), 
            isRepliable: jest.fn(() => repliable),
            member: mockMember,
            isChatInputCommand: jest.fn(() => false),
            isMessageContextMenuCommand: jest.fn(() => false)
        } as unknown as CommandInteraction;
    }

    public createMockMessageCommand(command: string, message: Message): MessageContextMenuCommandInteraction {
        return {
            ...this.createMockInteraction(command, this.guild, this.guildMember),
            targetMessage: message,
            isMessageContextMenuCommand: jest.fn(() => true)
        } as unknown as MessageContextMenuCommandInteraction
    }

    public createMockChatInputCommand(command: string, options: {} = {}): ChatInputCommandInteraction {
        return {
            ...this.createMockInteraction(command, this.guild, this.guildMember),
            options: this.createMockOptions(options),
            isChatInputCommand: jest.fn(() => true)
        } as unknown as ChatInputCommandInteraction;
    }

    public createMockMessage(options: MessageCreateOptions): Message {
        return {
            client: this.client,
            author: this.user,
            content: "MESSAGE CONTENT",
            createMessageComponentCollector: jest.fn((filter: Function, componentType: ComponentType, time: number | undefined) => {return this.createMockCollector(filter, componentType, time)}),
            ...options
        } as unknown as Message;
    }

    public createMockCollector(filter: Function, componentType: ComponentType, time: number | undefined): InteractionCollector<any> {
        return {
            filter: filter,
            componentType: componentType,
            time: time,
            on: jest.fn((event: "collect" | "dispose" | "ignore", listener: any) => {/* Do nothing */}),
        } as unknown as InteractionCollector<any>;
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

    public addRoleToMember(role: string): void {
        this.guildMember.roles.add(role);
    }

    public addRoleToGuild(role: string, moodColorHex: string): void {
        this.guild.roles.create({name: role, color: `#${moodColorHex}`})
    }

    public getMemberRoles(): Collection<string, any> {
        return this.memberRoles;
    }

    public getRoles(): Collection<string, any> {
        return this.roles;
    }
    public createMockMessageWithDM(): Message {
        // Mock a PartialDMChannel with the needed properties
        const dmChannel = {
            id: "mock-dm-channel-id",
            send: jest.fn(),
            createMessageCollector: jest.fn(),
        } as unknown as PartialDMChannel;
    
        // Mock a User with the DMChannel
        const author: User = {
            id: "mock-author-id",
            username: "Mock User",
            bot: false,
            send: jest.fn(),
            dmChannel, // Attach the mocked DMChannel
        } as unknown as User;
    
        // Return a mocked Message
        return {
            id: "mock-message-id",
            content: "Mocked message content",
            author,
            channel: dmChannel,
            createdTimestamp: Date.now(),
        } as unknown as Message;
    }
}