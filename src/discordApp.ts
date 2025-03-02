import "dotenv/config";
import { analyzeTone }  from "./gptRequests";
import { 
    Client, 
    GatewayIntentBits, 
    Events, 
    PermissionsBitField, 
    EmbedBuilder, 
    Message, 
    Interaction 
} from "discord.js";
import { clarify, embed, ping, tone, requestAnonymousClarification, mood } from "./interactions"
import serverConfigManager from "./serverConfigManager";

// define any emojis we'll use frequently here. either unicode character or just the id
const reactions = {
    heart: "❤️"
};


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

    client.on(Events.ClientReady, () => {
        if (client.user) {
            console.log(`client "ready": Logged in as ${client.user.tag}!`);
        } else {
            console.error(`client "ready": client.user is null!`);
        }
    });

    client.on(Events.MessageCreate, async (message: Message) => {
        // Special handling for toggle command - process it regardless of bot's enabled status
        if (message.content === '!toggle') {
            // Ensure the command is in a guild
            if (!message.guild) return;

            // Check for 'Manage Server' permission
            if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                return message.reply('You need "Manage Server" permission to toggle the bot!');
            }

            // Ensure message.author and message.guild are not null
            const authorId = message.author.id;
            const guildId = message.guild.id;

            // Toggle server status
            const serverConfig = serverConfigManager.toggleServerStatus(guildId, authorId);

            // Create an embed to show the new status
            const embed = new EmbedBuilder()
                .setColor(serverConfig.isEnabled ? '#00FF00' : '#FF0000')
                .setTitle('Bot Status')
                .setDescription(`Bot is now ${serverConfig.isEnabled ? 'enabled ✅' : 'disabled ❌'} in this server`)
                .addFields(
                    { 
                        name: 'Toggled By', 
                        value: serverConfig.toggledBy ? `<@${serverConfig.toggledBy}>` : 'Unknown', 
                        inline: true 
                    },
                    { 
                        name: 'Last Toggled', 
                        value: serverConfig.lastToggled 
                            ? new Date(serverConfig.lastToggled).toLocaleString() 
                            : 'Never', 
                        inline: true 
                    }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            return;
        }

        // For all other commands, check if bot is enabled for this server
        if (message.guild && !serverConfigManager.isServerEnabled(message.guild.id)) {
            return;
        }

        // Rest of your existing message handling logic
        if (message.mentions.has(client.user!)) {
            let tone;
            if (message.reference !== null) {
                const parentMessage = await message.fetchReference();
                
                // if replied to the bot without tagging the bot, don't analyze 
                if (parentMessage.author.id === client.user?.id &&
                    !message.content.includes(`<@${client.user?.id}>`)) {
                    return;
                }

                if (message.content === `<@${client.user?.id}>`) {
                    tone = await analyzeTone(parentMessage.content);
                } else {
                    tone = await analyzeTone(message.content);
                }
            } else {
                tone = await analyzeTone(message.content);
            }
            
            message.reply(tone);
        }

        console.log(message.content);
    });

    // Handle other interactions similar to message event
    client.on(Events.InteractionCreate, async (interaction: Interaction) => {
        // Check if interaction is in a guild and bot is enabled for this server
        // But allow the toggle command to work regardless
        if (interaction.guild && !serverConfigManager.isServerEnabled(interaction.guild.id)) {
            return;
        }

        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === "ping") await ping(interaction);
            if (interaction.commandName === "embed") await embed(interaction);
            if (interaction.commandName === "mood") await mood(interaction);
        } else if (interaction.isMessageContextMenuCommand()) {
            if (interaction.commandName === "Tone") await tone(interaction);
            if (interaction.commandName === "Clarify") await clarify(interaction);
            if (interaction.commandName === "Request Anonymous Clarification") await requestAnonymousClarification(interaction);
        } else {
            console.log(interaction);
        }
    });

    // attempt to connect
    await client.login(process.env.DISCORD_TOKEN);
    return client;
}

export default launchBot;
