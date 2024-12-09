import { CacheType, ChatInputCommandInteraction, DMChannel, EmbedBuilder, 
    Message, 
    MessageContextMenuCommandInteraction, SlashCommandBuilder } from "discord.js";
import { analyzeTone, analyzeMoodColor } from "./gptRequests";
import db from './firebase'; // Import from your firebase.ts file
import { ref, set, get, child } from "firebase/database";
import { updateOldRoleInServer, updateNewRoleInServer} from "./helpers"


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

export async function mood(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    var currentMood = interaction.options.getString('currentmood')!;
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
        let moodColorHex = await analyzeMoodColor(currentMood);
        await guild.roles.create({name: currentMood, color: `#${moodColorHex}`})
        let newRole = guild.roles.cache.find((r) => r.name === currentMood);
        member.roles.add(newRole!);
    }

    // Update database with roles
    await updateOldRoleInServer(interaction, oldMood);
    await updateNewRoleInServer(interaction, currentMood);

    interaction.reply({
        ephemeral: true,
        content: "Thanks for updating your mood!"
    })
}

//request anonymous clarification function - updating to include a queue of clarification requests
const clarificationQueueStore: { [key: string]: any[] } = {};

// Function to get or initialize the queue for a user
function getClarificationQueue(userId: string): any[] {
    if (!clarificationQueueStore[userId]) {
        clarificationQueueStore[userId] = [];
    }
    return clarificationQueueStore[userId];
}

export async function requestAnonymousClarification(interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply({ephemeral: true});

    try {
        const targetMessage = interaction.targetMessage;

        if(targetMessage){ 
            const messageContent = targetMessage.content;
            
            // Check if this exact message is already in the queue
            const clarificationQueue = getClarificationQueue(targetMessage.author.id);
            const existingRequest = clarificationQueue.find(req => 
                req.messageId === targetMessage.id && !req.isClarified
            );

            // Only add if not already in queue
            if (!existingRequest) {
                const clarificationRequest = {
                    messageId: targetMessage.id,
                    requesterId: interaction.user.id,
                    clarifierId: targetMessage.author.id,
                    content: messageContent,
                    isClarified: false
                };

                clarificationQueue.push(clarificationRequest);
            }

            await processQueue(interaction, clarificationQueue);
        }
    } catch(error) {
        console.error("Error handling anonymous clarification request: ", error);
        await interaction.editReply({
            content: "There was an error handling the clarification request",
        });
    }
}



async function processQueue(interaction: MessageContextMenuCommandInteraction<CacheType>, clarificationQueue: any[]) {
    const unclarifiedRequests = clarificationQueue.filter(request => !request.isClarified);

    // Exit if no pending requests
    if (unclarifiedRequests.length === 0) {
        clarificationQueue.length = 0;
        return;
    }

    const clarifier = await interaction.client.users.fetch(unclarifiedRequests[0].clarifierId);

    // Build clarification prompt
    let clarificationMessage = "You have the following pending clarification requests:\n";
    unclarifiedRequests.forEach((request, index) => {
        clarificationMessage += `${index + 1}. Message: "${request.content}"\n`;
    });
    clarificationMessage += "\nReply with the number of the message you'd like to clarify.";

    await clarifier.send(clarificationMessage);

    // Create a single collector to handle both selection and clarification
    const filter = (response: Message) => 
        response.author.id === clarifier.id && response.channel instanceof DMChannel;

    const collector = clarifier.dmChannel?.createMessageCollector({ filter });

    collector?.on('collect', async (message) => {
        const selectedNumber = parseInt(message.content, 10);

        if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= unclarifiedRequests.length) {
            // Valid selection
            const selectedRequest = unclarifiedRequests[selectedNumber - 1];

            // Prompt for clarification
            await clarifier.send(`You selected message: "${selectedRequest.content}". Please reply with your clarification now.`);

            // Create a new collector for the clarification message
            const clarificationCollector = clarifier.dmChannel?.createMessageCollector({ 
                filter, 
                max: 1 
            });

            clarificationCollector?.on('collect', async (clarificationMessage) => {
                await handleClarification(interaction, clarificationQueue, selectedRequest, clarificationMessage);
                clarificationCollector.stop();

                //new stuff
                const remainingRequests = clarificationQueue.filter(req => !req.isClarified);
                if (remainingRequests.length > 0 ){
                    await processQueue(interaction, clarificationQueue);

                }

                // Continue processing the queue
                //await processQueue(interaction, clarificationQueue);
            });

            // Stop the main collector once a valid selection is made
            collector.stop();
        } else {
            // Invalid input
            await clarifier.send("Invalid selection. Please reply with a valid number.");
        }
    });
    collector?.on('end', () => {
        // Ensure the queue clears when processing is done
        if (clarificationQueue.filter(req => !req.isClarified).length === 0) {
            clarificationQueue.length = 0;
        }
    });

}

async function handleClarification(
    interaction: MessageContextMenuCommandInteraction<CacheType>, 
    clarificationQueue: any[], 
    request: any, 
    clarificationMessage: Message
) {
    // Perform tone analysis
    const toneAnalysis = await analyzeTone(clarificationMessage.content);
    const finalTone = toneAnalysis || "Neutral";

    const requester = await interaction.client.users.fetch(request.requesterId);

    // Notify the requester about the clarification result
    await requester.send(`Requested Tone Clarification for message "${request.content}": "${finalTone}"`);

    // Mark the request as clarified
    request.isClarified = true;
    await interaction.client.users.send(request.clarifierId, "Thank you! The clarification has been submitted.");

    // Remove the clarified request from the queue
    const index = clarificationQueue.findIndex(req => req.messageId === request.messageId);
    if (index !== -1) {
        clarificationQueue.splice(index, 1);
    }

    // if(clarificationQueue.length>0){
    //     await processQueue(interaction, clarificationQueue);
    // }
}