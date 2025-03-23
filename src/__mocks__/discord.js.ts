import { Client, ClientOptions, GuildManager, RESTOptions, UserFlagsBitField } from "discord.js";

const discordJS = jest.requireActual<typeof import("discord.js")>("discord.js");
const mockDiscordJS = jest.createMockFromModule<typeof import("discord.js")>("discord.js");

mockDiscordJS.MessageFlags = discordJS.MessageFlags;
mockDiscordJS.EmbedBuilder = discordJS.EmbedBuilder;
mockDiscordJS.ApplicationCommandOptionType = discordJS.ApplicationCommandOptionType;
mockDiscordJS.GatewayIntentBits = discordJS.GatewayIntentBits;
mockDiscordJS.UserFlags = discordJS.UserFlags;
mockDiscordJS.ApplicationCommandType = discordJS.ApplicationCommandType;
mockDiscordJS.Collection = discordJS.Collection;

Object.defineProperty(mockDiscordJS, "Routes", {
    writable: true,
    value: {
        ...discordJS.Routes,
        applicationCommands: (appId: string) => `/applications/${appId}/commands`
    }
});

class MockREST extends discordJS.REST {
    constructor(options?: RESTOptions) {
        super(options);
    }

    public put(url: string, options: any): Promise<any> {
        return Promise.resolve({});
    }

    public setToken(token: string): this {
        return this;
    }
}


class MockGuildManager {
    create: jest.Mock;
    fetch: jest.Mock;
    setIncidentActions: jest.Mock;
    widgetImageURL: jest.Mock;

    constructor() {
        this.create = jest.fn().mockResolvedValue(null);
        this.fetch = jest.fn().mockResolvedValue(new mockDiscordJS.Collection());
        this.setIncidentActions = jest.fn().mockResolvedValue(null);
        this.widgetImageURL = jest.fn().mockResolvedValue(null);
    }
}

// @ts-ignore
class MockClient {
    _ready: true = true;
    on: jest.Mock;
    options: ClientOptions;
    token: string;
    guilds: GuildManager;

    constructor(options?: ClientOptions) {
        this.on = MockClient.prototype.on;
        this.login = MockClient.prototype.login;
        this.options = {
            intents: {
                bitfield: discordJS.BitField.resolve(options?.intents)
            } as any
        }
        this.token = "test-token";
        this.guilds = new MockGuildManager() as unknown as GuildManager;
    }

    public login(token: string): Promise<void> {
        this.token = token;
        return Promise.resolve(undefined);
    }
}

MockClient.prototype.on = jest.fn().mockResolvedValue(undefined);

class MockClientUser {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    bot: boolean;
    system: boolean;
    flags: UserFlagsBitField;
    mfa_enabled: boolean;
    verified: boolean;
    token: string;
    private _tag: string;
    public get tag(): string {
        return this._tag;
    }
    public set tag(value: string) {
        this._tag = value;
    }
    
    constructor(client: Client<true>) {
        
        this.id = "1234567890";
        this.username = "testuser";
        this.discriminator = "1234";
        this.avatar = "testavatar";
        this.bot = true;
        this.system = false;
        this.flags = new discordJS.UserFlagsBitField(discordJS.UserFlags.ActiveDeveloper);
        this.mfa_enabled = false;
        this.verified = true;
        this._tag = `${this.username}#${this.discriminator}`;
        this.token = "test-token";
    }
};



// @ts-ignore
mockDiscordJS.REST = MockREST;
mockDiscordJS.Client = MockClient as unknown as typeof discordJS.Client;
mockDiscordJS.ClientUser = MockClientUser as unknown as typeof discordJS.ClientUser;
mockDiscordJS.GuildManager = MockGuildManager as unknown as typeof discordJS.GuildManager;

module.exports = mockDiscordJS;
