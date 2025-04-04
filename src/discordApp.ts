import "dotenv/config";
import {
    Client,
    GatewayIntentBits,
    Events,
    Message,
} from "discord.js";
import { clarify, embed, ping, tone, requestAnonymousClarification, mood, toggleBot, inDepthClarification, postemptiveToneAdd, getTones, action, toggleDMs } from "./interactions"
import { cleanupMoods } from "./helpers";
import { getServerSetting, getUserSetting } from "./botSettings";


export async function launchBot(): Promise<Client> {
    // the client has to declare the features it uses up front so discord.js knows if it can
    // ignore some fields and callbacks to save on hosting resources. here are some links to clarify:
    // discord.js: https://discordjs.guide/popular-topics/intents.html#error-disallowed-intents
    // discord API: https://discord.com/developers/docs/topics/gateway#list-of-intents
    const client = new Client({
        intents: [
            GatewayIntentBits.GuildExpressions,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    client.on(Events.ClientReady, () => {
        if (client.user) {
            console.log(`client "ready": Logged in as ${client.user.tag}!`);

            client.guilds.fetch().then(guilds => {
                guilds.map((_, id) => {
                    console.log(`cleaning up roles in guild with id ${id}`);
                    cleanupMoods(client, id);
                })
            });
        } else {
            console.error(`client "ready": client.user is null!`);
        }
    });

    client.on(Events.MessageCreate, async (message: Message) => {
        console.log(message.content);
        // TODO: add tone analysis here as well
    });

    client.on(Events.InteractionCreate, async (interaction) => {
        const userId = interaction.user.id; // Get the user ID for individual DM status
        const guildId = interaction.guildId!; // Get the guildId for server-wide bot status

        try {
            // Check the bot status for the server
            const botStatus = await getServerSetting(guildId); // Default to 'active' if not set

            // If the bot is inactive, ignore the interaction and reply with a message
            if (botStatus === "inactive") {
                if (interaction.isCommand() && interaction.commandName !== "togglebot") {
                    return interaction.reply({
                        content: "Sorry, the bot is currently disabled for this server.",
                        flags: 64, // Make it ephemeral
                    });
                }
            }

            // Process the interaction if DMs are enabled for the user and the bot is active for the server
            if (interaction.isChatInputCommand()) {
                if (interaction.commandName === "ping") await ping(interaction);
                if (interaction.commandName === "embed") await embed(interaction);
                if (interaction.commandName === "action") await action(interaction);
                if (interaction.commandName === "list-tones") await getTones(interaction);
                if (interaction.commandName === "mood") await mood(interaction);
                if (interaction.commandName === "togglebot") await toggleBot(interaction);
                if (interaction.commandName === "toggledms") await toggleDMs(interaction); // Handle toggle DM command
            } else if (interaction.isMessageContextMenuCommand()) {
                if (interaction.commandName === "Tone") await tone(interaction);
                if (interaction.commandName === "Add Tone") await postemptiveToneAdd(interaction);
                if (interaction.commandName === "Clarify") await clarify(interaction);
                if (interaction.commandName === "In-Depth Clarification") await inDepthClarification(interaction);
                if (interaction.commandName === "Request Anonymous Clarification") await requestAnonymousClarification(interaction);
            } else {
                console.log(interaction);
            }
        } catch (error) {
            console.error("Error processing interaction:", error);
            if (interaction.isCommand()) {
                interaction.reply({
                    content: "There was an error while processing your request. Please try again later.",
                    flags: 64, // Make it ephemeral
                });
            }
        }
    });

    // attempt to connect
    await client.login(process.env.DISCORD_TOKEN);
    return client;
}

export default launchBot;
