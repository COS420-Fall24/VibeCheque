import "dotenv/config";
import analyzeTone from "./gptRequests.js"
import { Client, GatewayIntentBits, Interaction, CacheType, Events, ClientUser } from "discord.js";

// define a bunch of emojis we'll use frequently here. either unicode character or just the id
const reactions = {
    heart: "❤️"
};

async function ping(interaction: Interaction<CacheType>): Promise<void> {
    setTimeout(() => {
        if (interaction.isRepliable()) {
            interaction.reply(`pong!`);
        }
    }, 1000);
}

async function launchBot(): Promise<string> {
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
            console.warn(`client "ready": client.user is null!`);
        }
    });

    // called when a message is sent
    client.on(Events.MessageCreate, async (message) => {
        // message.content shows the body of the messages, with a few quirks. For one,
        // any emojis will be in the discord format, and pings will show up as some
        // arbitrary snowflake (ask me or look it up) e.g. `<@1295481669603688499>`

        // console.log(message.content);
        if (message.mentions.has(client.user as ClientUser)) {
            // console.log("mentioned!");
            // message.react(reactions.heart);

            // check if the message has a reference (a parent message aka if this message is a reply to another one)
            // if so, and the message is just tagging the bot, analyze the parent message
            // if not, analyze the sent message instead
            var tone;
            var messageToReply;
            if (message.reference !== null){
                var parentMessage = await message.fetchReference()
                // if replied to the bot without tagging the bot, don't analyze 
                if (parentMessage.author.id === client.user?.id && 
                    !message.content.includes(`<@${client.user?.id}>`)){ 
                    return;
                }
                if (message.content === `<@${client.user?.id}>` ){
                    messageToReply = parentMessage;
                    tone = await analyzeTone(parentMessage.content);
                }
                else {
                    messageToReply = parentMessage;
                    tone = await analyzeTone(message.content);
                }
            } else {
                messageToReply = message;
                tone = await analyzeTone(message.content);
            }

            if (tone.includes("detected")){
                messageToReply.author.send(tone);
            } else {
                messageToReply.author.send(messageToReply.content + " - This message gives " + 
                    tone.toLowerCase().split('').reduce((acc, char) => {
                        return /[a-zA-Z]/.test(char) ? acc + char : acc;
                    }, '') + " tone");
            }
            // message.reply(tone);
        }
    });
    
    // called when an interaction (e.g. slash command) is called. there are a bunch of different
    // interaction types, but we'll see which we need as time goes on.
    // TODO: find references for this
    client.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === "ping") await ping(interaction);
        } else if (interaction.isMessageComponent()) {
        } else {
            console.log(interaction);
        }
    });

    // attempt to connect
    return client.login(process.env.DISCORD_TOKEN);
}

export default launchBot;
