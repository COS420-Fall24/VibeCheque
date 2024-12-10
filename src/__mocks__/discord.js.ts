import { Client, ClientOptions, RESTOptions, UserFlagsBitField } from "discord.js";

const discordJS = jest.requireActual<typeof import("discord.js")>("discord.js");
const mockDiscordJS = jest.createMockFromModule<typeof import("discord.js")>("discord.js");

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
    put: jest.Mock;
    setToken: jest.Mock;

    constructor(options?: RESTOptions) {
        super(options);
        this.put = jest.fn().mockResolvedValue({});
        this.setToken = jest.fn().mockReturnThis();
    }
}

// @ts-ignore
class MockClient {
    _ready: true = true;
    on: jest.Mock;
    options: ClientOptions;
    token: string;
    constructor(options?: ClientOptions) {
        this.on = MockClient.prototype.on;
        this.login = MockClient.prototype.login;
        this.options = {
            intents: {
                bitfield: discordJS.BitField.resolve(options?.intents)
            } as any
        }
        this.token = "test-token";
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

module.exports = mockDiscordJS;
