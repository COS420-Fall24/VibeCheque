import { CacheType, ChatInputCommandInteraction, EmbedBuilder, 
    MessageContextMenuCommandInteraction, SlashCommandBuilder } from "discord.js";
import analyzeTone from "./gptRequests";
import db from './firebase'; // Import from your firebase.ts file
import { ref, set, get, child } from "firebase/database";
import { updateOldRoleInServer, updateNewRoleInServer} from "./helpers"

export async function mood(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    var currentMood = interaction.options.get('currentmood')?.value!.toString();

    let oldMood = "";

    // Get the old mood from database
    var dbRef = ref(db);
    await get(child(dbRef, 'servers/' + interaction.guildId + '/username/' + interaction.user.id)).then((snapshot) => {
        if (snapshot.exists()) {
            oldMood = snapshot.val()["mood"]
        } else {
          console.log("No data available");
        }
      }).catch((error) => {
        console.error(error);
    });

    let guild = interaction.guild!;
    let member = await guild.members.fetch(interaction.user.id);

    // delete the old mood from roles
    if (interaction.guild?.roles.cache.find(role => role.name === oldMood)) {
        if (member.roles.cache.find(role => role.name === oldMood)){
            let oldRole = interaction.guild?.roles.cache.find(role => role.name === oldMood);
            member.roles.remove(oldRole!);
        }
    }

    // set the new mood in database
    await set(ref(db, 'servers/' + interaction.guildId + '/username/' + interaction.user.id), {
        mood: currentMood,
        timestamp: interaction.createdTimestamp
    });

    // update new role
    if (interaction.guild?.roles.cache.find(role => role.name === currentMood)) {
        let newRole = guild.roles.cache.find((r) => r.name === currentMood);
        member.roles.add(newRole!);
    } else {
        await guild.roles.create({name: currentMood})
        let newRole = guild.roles.cache.find((r) => r.name === currentMood);
        member.roles.add(newRole!);
    }

    // Update database with roles
    console.log(await updateOldRoleInServer(interaction, oldMood));
    console.log(await updateNewRoleInServer(interaction, currentMood));

    interaction.reply({
        ephemeral: true,
        content: "Thanks for updating your mood!"
    })
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