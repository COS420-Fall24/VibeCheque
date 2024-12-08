import { DMChannel, PartialGroupDMChannel, User, Client, Message, CacheType, ChatInputCommandInteraction, EmbedBuilder, 
    MessageContextMenuCommandInteraction, ChannelType, SlashCommandBuilder } from "discord.js";
import analyzeTone from "./gptRequests";
//import db from './firebase'; // Import from your firebase.ts file
//import { ref, set, get, child } from "firebase/database";

// export async function mood(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
//     var currentMood = interaction.options.get('currentmood')?.value!.toString();
//     var oldMood = "";

//     // Get the old mood from database
//     var dbRef = ref(db);
//     get(child(dbRef, 'servers/' + interaction.guildId + '/username/' + interaction.user.id)).then((snapshot) => {
//         if (snapshot.exists()) {
//             oldMood = snapshot.val()["mood"]
//         } else {
//           console.log("No data available");
//         }
//       }).catch((error) => {
//         console.error(error);
//      });

//     // delete the old mood from roles
//     if (interaction.guild?.roles.cache.find(role => role.name === oldMood)) {
//         let guild = interaction.guild!;
//         let role = guild.roles.cache.find((r) => r.name === currentMood);
//         let member = await guild.members.fetch(interaction.user.id);
//         member.roles.remove(role!);
//     } else {
//         let guild = interaction.guild!;
//         await guild.roles.create({name: currentMood})
//         let role = guild.roles.cache.find((r) => r.name === oldMood);
//         let member = await guild.members.fetch(interaction.user.id);
//         member.roles.remove(role!);
//     }

//     // set the new mood in database
//     set(ref(db, 'servers/' + interaction.guildId + '/username/' + interaction.user.id), {
//         mood: currentMood,
//         timestamp: interaction.createdTimestamp
//     });

//     // update new role
//     if (interaction.guild?.roles.cache.find(role => role.name === currentMood)) {
//         let guild = interaction.guild!;
//         let role = guild.roles.cache.find((r) => r.name === currentMood);
//         let member = await guild.members.fetch(interaction.user.id);
//         member.roles.add(role!);
//     } else {
//         let guild = interaction.guild!;
//         await guild.roles.create({name: currentMood})
//         let role = guild.roles.cache.find((r) => r.name === currentMood);
//         let member = await guild.members.fetch(interaction.user.id);
//         member.roles.add(role!);
//     }

//     interaction.reply({
//         ephemeral: true,
//         content: "Thanks for updating your mood!"
//     })
// }

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

    // If no unclarified requests, clear the queue and exit
    if (unclarifiedRequests.length === 0) {
        clarificationQueue.length = 0;
        return;
    }

    const clarifier = await interaction.client.users.fetch(unclarifiedRequests[0].clarifierId);

    // Single request scenario
    if (unclarifiedRequests.length === 1) {
        const singleRequest = unclarifiedRequests[0];
        await clarifier.send(`You have a pending clarification request for the message: "${singleRequest.content}". Please provide your clarification.`);
    } 
    // Multiple request scenario
    else {
        let clarificationMessage = "You have the following pending clarification requests:\n";
        unclarifiedRequests.forEach((request, index) => {
            clarificationMessage += `${index + 1}. Message: "${request.content}"\n`;
        });
        clarificationMessage += "\nReply with the number of the message you'd like to clarify.";
        await clarifier.send(clarificationMessage);
    }

    // Create a collector for the clarifier's response
    const filter = (response: Message) => 
        response.author.id === clarifier.id && response.channel instanceof DMChannel;

    const collector = clarifier.dmChannel?.createMessageCollector({ filter });

    collector?.on('collect', async (message) => {
        const selectedNumber = parseInt(message.content, 10);

        if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= unclarifiedRequests.length) {
            const selectedRequest = unclarifiedRequests[selectedNumber - 1];
            await clarifier.send(`You selected message: "${selectedRequest.content}". Please reply with your clarification now.`);

            // Create a new collector for the clarification message
            const clarificationCollector = clarifier.dmChannel?.createMessageCollector({ 
                filter, 
                max: 1 
            });

            clarificationCollector?.on('collect', async (clarificationMessage) => {
                await handleClarification(interaction, clarificationQueue, selectedRequest, clarificationMessage);
                clarificationCollector.stop(); // Stop the clarification collector
                collector.stop(); // Stop the initial collector
            });
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

    // Process remaining unclarified requests
    await processQueue(interaction, clarificationQueue);
}