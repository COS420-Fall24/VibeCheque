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
  GuildMemberManager,
  Collection,
  ChatInputCommandInteraction,
  InteractionReplyOptions
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
    private roles: Collection<string, any>;
    private memberRoles: Collection<string, any>;

    constructor(options: MockDiscordOptions) {
        this.memberRoles = new Collection();
        this.roles = new Collection();
        
        this.mockClient();
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

        this.interaction = this.createMockInteraction(options.command, this.guild, this.guildMember, options.commandOptions);
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

    public createMockInteraction(command: string, mockGuild: any, mockMember: any, options: {} = {}): CommandInteraction {
        return {
            client: this.client,
            user: this.user,
            guild: mockGuild,
            data: command,
            options: this.createMockOptions(options ? options : {}),
            id: BigInt(1),
            reply: jest.fn((replyOptions: string | MessagePayload | InteractionReplyOptions) => {
                this.interactionReply = replyOptions;
                return Promise.resolve();
            }),
            deferReply: jest.fn(),
            editReply: jest.fn((reply: string | MessagePayload | InteractionEditReplyOptions) => {
                this.interactionReply = reply;
                return Promise.resolve();
            }), 
            isRepliable: jest.fn(() => true),
            member: mockMember
        } as unknown as CommandInteraction;
    }

    public createMockMessageCommand(command: string, message: Message): MessageContextMenuCommandInteraction {
        return {
            ...this.createMockInteraction(command, this.guild, this.guildMember),
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

    
}
