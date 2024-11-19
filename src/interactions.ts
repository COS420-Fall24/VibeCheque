import { CacheType, ChatInputCommandInteraction, EmbedBuilder, 
    MessageContextMenuCommandInteraction, SlashCommandBuilder } from "discord.js";
import analyzeTone from "./gptRequests";
import db from './firebase'; // Import from your firebase.ts file
import { ref, set } from "firebase/database";

export async function mood(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    interaction.reply({
        ephemeral: true,
        content: "Thanks for updating your mood!"
    })
    set(ref(db, 'server/' + interaction.guildId + '/username/' + interaction.id), {
        mood: interaction.options.get('currentMood'),
        timestamp: interaction.createdTimestamp
    });
}

// Example: Add a document to a collection


export async function ping(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();
    return new Promise((resolve, reject) => {
        setTimeout(() => {
                if (interaction.isRepliable()) {
                    interaction.editReply(`pong!`);
                    resolve();
                } else {
                    reject();
                }
        }, 1000);
    })
}

export async function embed(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    const embed1 = new EmbedBuilder()
        .setColor("#aa33aa")
        .setTitle("Purple Embed");
    
    const embed2 = new EmbedBuilder()
        .setColor("#33aa33")
        .setTitle("Green Embed");
    
    interaction.editReply({ embeds: [embed1, embed2] });
}

export async function tone(interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    try {
        interaction.editReply(await analyzeTone(interaction.targetMessage.content));
    } catch (error) {
        interaction.editReply("Something went wrong.");
        console.error(error);
    }
}

export async function clarify(interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
    interaction.reply({
        ephemeral: true,
        content: "Thanks for pointing that out, I'll ask for you!"
    })
    if (interaction.channel?.isSendable()) {

        interaction.channel.send(`Hey there, ${interaction.targetMessage.author}! It seems I wasn't able to understand the tone in one of your messages:

> ${interaction.targetMessage.content.split('\n').join("\n> ")}

To help me learn, I was hoping you could clarify the tone of your message.
Here's a short list of tones: \`<embed>\` (***TODO***)`);
    }
}