import "dotenv/config";
import { Client, GatewayIntentBits, Events } from "discord.js";
import { clarify, embed, ping, tone, requestAnonymousClarification, mood, toggleBot } from "./interactions"

export async function launchBot(): Promise<Client> {
    // the client has to declare the features it uses up front so discord.js kno9ws if it can
    // ignore some fields and callbacks to save on hosting resources. here are some links to clarify:
    // discord.js: https://discordjs.guide/popular-topics/intents.html#error-disallowed-intents
    // discord API: https://discord.com/developers/docs/topics/gateway#list-of-intents
    const client = new Client({
        intents: [
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    // client.on takes an event and a function, and calls that function once the evnt is called.
    // eventually, it may be wise to make each callback its own function for readibility.

    // called when bot is live
    client.on(Events.ClientReady, () => {
        if (client.user) {
            console.log(`client "ready": Logged in as ${client.user.tag}!`);
        } else {
            console.error(`client "ready": client.user is null!`);
        }
    });

    // called when a message is sent
    client.on(Events.MessageCreate, async (message) => {
        // message.content shows the body of the messages, with a few quirks. For one,
        // any emojis will be in the discord format, and pings will show up as some
        // arbitrary snowflake (ask me or look it up) e.g. `<@1295481669603688499>`

        console.log(message.content);

        // TODO: add tone analysis here as well
    });
    
    // called when an interaction (e.g. slash command) is called. there are a bunch of different
    // interaction types, but we'll see which we need as time goes on.
    // TODO: find references for this
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isChatInputCommand()) { // slash command
            if (interaction.commandName === "ping") await ping(interaction);
            if (interaction.commandName === "embed") await embed(interaction);
            if (interaction.commandName === "mood") await mood(interaction);
            if (interaction.commandName === "togglebot") await toggleBot(interaction);
        } else if (interaction.isMessageContextMenuCommand()) { // command from the "apps" menu when clicking on a message
            if (interaction.commandName === "Tone") await tone(interaction);
            if (interaction.commandName === "Clarify") await clarify(interaction);
            if (interaction.commandName === "Request Anonymous Clarification") await requestAnonymousClarification(interaction);
        } else {
            console.log(interaction);
        }
    });

    // attempt to connect
    client.login(process.env.DISCORD_TOKEN);

    return client;
}
