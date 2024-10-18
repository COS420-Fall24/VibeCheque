import "dotenv/config";
import { Client, GatewayIntentBits, Interaction, CacheType } from "discord.js";

async function ping(interaction: Interaction<CacheType>): Promise<void> {
    setTimeout(() => {
        if (interaction.isRepliable()) {
            interaction.reply(`pong!`);
        }
    }, 1000);
}

async function launchBot(): Promise<string> {
    const client = new Client({
        intents: [
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.Guilds,
        ],
    });

    client.on("ready", () => {
        if (client.user) {
            console.log(`client "ready": Logged in as ${client.user.tag}!`);
        } else {
            console.warn(`client "ready": client.user is null!`);
        }
    });

    client.on("interactionCreate", async (interaction) => {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === "ping") await ping(interaction);
        } else {
            console.log(interaction);
        }
    });

    return client.login(process.env.DISCORD_TOKEN);
}

export default launchBot;
