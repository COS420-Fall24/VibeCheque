import {
    CacheType,
    ChatInputCommandInteraction,
    EmbedBuilder,
    MessageContextMenuCommandInteraction,
    Role,
    Snowflake
} from "discord.js";
import { analyzeTone, analyzeMoodColor } from "./gptRequests";
import db from './firebase'; // Import from your firebase.ts file
import { ref, set, get, child, query } from "firebase/database";
import { addRoleToDatabase, MINIMUM_MOOD_LIFESPAN, removeRoleFromDatabase, removeRoleIfUnused} from "./helpers"

/**
 * the callback to a `ping` interaction
 * 
 * @param interaction the interaction which triggered the function call
 * @returns a promise, which resolves when the command is complete
 */
export async function ping(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    // defer a reply in case something goes wrong
    await interaction.deferReply();

    return new Promise((resolve, reject) => {
        // reply after 1 second
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

/**
 * the callback to an `embed` interaction
 * 
 * @param interaction the interaction which triggered the function call
 * @returns void
 */
export async function embed(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    // create a purple embed
    const embed1 = new EmbedBuilder()
        .setColor("#aa33aa")
        .setTitle("Purple Embed");
    
    // create a green embed
    const embed2 = new EmbedBuilder()
        .setColor("#33aa33")
        .setTitle("Green Embed");
    
    // reply with those embeds
    interaction.editReply({ embeds: [embed1, embed2] });
}

/**
 * the callback to a `tone` interaction
 * 
 * @param interaction the interaction which triggered the function call
 * @returns void
 */
export async function tone(interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    // attempt to analyze the tone
    try {
        // reply with the GPT response if it is valid
        interaction.editReply(await analyzeTone(interaction.targetMessage.content));
    } catch (error) {
        // otherwase, inform the user that an error occured
        interaction.editReply("Something went wrong.");
        console.error(error);
    }
}

/**
 * the callback to a `clarify` interaction
 * 
 * @param interaction the interaction which triggered the function call
 * @returns void
 */
export async function clarify(interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
    // start by replying to the user letting them know the interaction went through
    interaction.reply({
        ephemeral: true,
        content: "Thanks for pointing that out, I'll ask for you!"
    })

    // then ask the message's author for clarification
    if (interaction.channel?.isSendable()) {

        interaction.channel.send(`Hey there, ${interaction.targetMessage.author}! It seems I wasn't able to understand the tone in one of your messages:

> ${interaction.targetMessage.content.split('\n').join("\n> ")}

To help me learn, I was hoping you could clarify the tone of your message.
Here's a short list of tones: \`<embed>\` (***TODO***)`);
    }
}

/**
 * the callback to a `mood` interaction
 * 
 * @param interaction the interaction which triggered the function call
 * @returns void
 */
export async function mood(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    var currentMood = interaction.options.getString('currentmood')!;
    let oldMood: Snowflake | undefined = undefined;

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

    if (oldMood) {
        // delete the old mood from roles
        guild.roles.fetch(oldMood).then(role => {
            if (role) {
                member.roles.remove(role);
                setTimeout(() => removeRoleIfUnused(role), MINIMUM_MOOD_LIFESPAN);
            }
        }).catch((error) => {
            console.error(error);
        });
    }

    let newRole: Role | undefined;

    // update new role
    if (interaction.guild?.roles.cache.find(role => role.name === currentMood)) {
        newRole = guild.roles.cache.find((r) => r.name === currentMood);
        member.roles.add(newRole!);
    } else {
        let moodColorHex = await analyzeMoodColor(currentMood);
        await guild.roles.create({name: currentMood, color: `#${moodColorHex}`})
        newRole = guild.roles.cache.find((r) => r.name === currentMood);
        member.roles.add(newRole!);
    }

    // set the new mood in database
    await set(ref(db, 'servers/' + interaction.guildId + '/username/' + interaction.user.id), {
        mood: newRole!.id,
        timestamp: interaction.createdTimestamp
    });

    // Update database with new role
    await addRoleToDatabase(interaction.guildId!, newRole!);

    interaction.reply({
        ephemeral: true,
        content: "Thanks for updating your mood!"
    })
}

/**
 * the callback to a `requestAnonymousClarification` interaction
 * 
 * @param interaction the interaction which triggered the function call
 * @returns void
 */
export async function requestAnonymousClarification(interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void>{
    await interaction.deferReply({ephemeral: true});

    try {
        const targetMessage = interaction.targetMessage;

        if(targetMessage){ 
            //Send an anonymous request to user of message
            await targetMessage.author.send(`You've received an anonymous request for clarification on your message: "${targetMessage.content}". Will you clarify your tone?`);
            //Let the user who requested clarification know that the message sent
            await interaction.editReply({
                //ephemeral: true,
                content: "Your request for anonymous clarification has been sent.",
                
            });

            //Bot waits for the message - 60 seconds. Maybe longer or shorter? no idea
            const filter = (response: any) => response.author.id === targetMessage.author.id && response.channelId === targetMessage.author.dmChannel?.id;
            const collector = targetMessage.author.dmChannel?.createMessageCollector({filter, time: 60000});

            collector?.on("collect", async (clarificationMessage) => {
                //This analyzes the response
                const toneAnalysis = await analyzeTone(clarificationMessage.content)
                //send the analyzed tone back to requester
                await interaction.user.send(`Requested Tone Clarification: "${toneAnalysis}"`);

                //stops the collector 
                collector.stop();

            });

            //If the user doesn't respond in time, this will run
            collector?.on("end", async (collected, reason)=> {
                if (reason === "time"){
                    await interaction.user.send("The user did not respond in time.")//We can maybe change the time, and how this works later
                }
            });
        }

    } catch(error){
        console.error("Error handling anonymous clarification request: ", error);
        await interaction.editReply({
            //ephemeral: true,
            content: "There was an error handling the clarification request",
        });
    }
}