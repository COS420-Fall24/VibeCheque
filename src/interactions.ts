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
export async function requestAnonymousClarification(interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void>{
    await interaction.deferReply({ephemeral: true});

    try {
        const targetMessage = interaction.targetMessage;

        if(targetMessage){ 
            const messageContent = targetMessage.content;
            //Send an anonymous request to user of message
            await targetMessage.author.send(`You've received an anonymous request for clarification on your message: "${targetMessage.content}". Will you clarify your tone?`);
            //Let the user who requested clarification know that the message sent
            await interaction.editReply({
                //ephemeral: true,
                content: "Your request for anonymous clarification has been sent.",
                
            });

            const clarificationRequest = {
                messageId: targetMessage.id,
                requesterId: interaction.user.id,
                clarifierId: targetMessage.author.id,
                content: messageContent,
                isClarified: false
            };

            const clarificationQueue = getClarificationQueue(targetMessage.author.id); 
            clarificationQueue.push(clarificationRequest);

            await processQueue(interaction, clarificationQueue);




        }




    } catch(error){
        console.error("Error handling anonymous clarification request: ", error);
        await interaction.editReply({
            //ephemeral: true,
            content: "There was an error handling the clarification request",
        });
    }
}



async function notifyClarifier(client: Client, clarifierId: string, clarificationQueue: any[]){
    const clarifier = await client.users.fetch(clarifierId);
    const unclarifiedRequests = clarificationQueue.filter(request => !request.isClarified);

    if(unclarifiedRequests.length === 1){
        const singleRequest = unclarifiedRequests[0];
        //await clarifier.send(`You have a pending clarification request for the message: "${singleRequest.content}". Please clarify by responding to this message.`);

    }else if (unclarifiedRequests.length > 1){
        let clarificationMessage = "You have the following pending clarification requests:\n";
        unclarifiedRequests.forEach((request, index) => {
            clarificationMessage += `${index + 1}. Message: "${request.content}"\n`;

    });

    clarificationMessage += "\nReply with the number of the message you'd like to clarify.";
    await clarifier.send(clarificationMessage);


    }


}

//function to go through the queue 
async function processQueue(interaction: MessageContextMenuCommandInteraction<CacheType>, clarificationQueue: any[]) {
    // Filter out already clarified requests
    let unclarifiedRequests = clarificationQueue.filter(request => !request.isClarified);

    // If no unclarified requests remain, exit
    if (unclarifiedRequests.length === 0) return;

    const clarifier = await interaction.client.users.fetch(unclarifiedRequests[0].clarifierId);

    // Single request scenario
    if (unclarifiedRequests.length === 1) {
        const singleRequest = unclarifiedRequests[0];
        await clarifier.send(`You have a pending clarification request for the message: "${singleRequest.content}". Please provide your clarification.`);

        // Wait for a single clarification message
        try {
            const collectedMessages = await clarifier.dmChannel?.awaitMessages({
                max: 1,
                time: 60000,
                filter: (m) => m.author.id === clarifier.id
            });

            if (collectedMessages && collectedMessages.size > 0) {
                const clarificationResponse = collectedMessages.first();
                if (clarificationResponse) {
                    await handleClarificationResponse(
                        interaction, 
                        clarificationQueue, 
                        singleRequest, 
                        clarificationResponse
                    );
                }
            }
        } catch (error) {
            console.error("Error collecting clarification:", error);
        }
    } 
    // Multiple request scenario
    else {
        // List out unclarified requests
        let clarificationMessage = "You have the following pending clarification requests:\n";
        unclarifiedRequests.forEach((request, index) => {
            clarificationMessage += `${index + 1}. Message: "${request.content}"\n`;
        });
        clarificationMessage += "\nReply with the number of the message you'd like to clarify.";
        await clarifier.send(clarificationMessage);

        // Wait for selection message
        try {
            const selectionMessages = await clarifier.dmChannel?.awaitMessages({
                max: 1,
                time: 60000,
                filter: (m) => m.author.id === clarifier.id
            });

            if (selectionMessages && selectionMessages.size > 0) {
                const selectionResponse = selectionMessages.first();
                if (selectionResponse) {
                    const selectedNumber = parseInt(selectionResponse.content, 10);

                    if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > unclarifiedRequests.length) {
                        await clarifier.send("Invalid selection. Please try again.");
                        return;
                    }

                    const selectedRequest = unclarifiedRequests[selectedNumber - 1];
                    await clarifier.send(`You selected message: "${selectedRequest.content}". Please reply with your clarification now.`);

                    // Wait for clarification message
                    const clarificationMessages = await clarifier.dmChannel?.awaitMessages({
                        max: 1,
                        time: 60000,
                        filter: (m) => m.author.id === clarifier.id
                    });

                    if (clarificationMessages && clarificationMessages.size > 0) {
                        const clarificationResponse = clarificationMessages.first();
                        if (clarificationResponse) {
                            await handleClarificationResponse(
                                interaction, 
                                clarificationQueue, 
                                selectedRequest, 
                                clarificationResponse
                            );
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error processing clarification request:", error);
        }
    }
}

async function handleClarificationResponse(
    interaction: MessageContextMenuCommandInteraction<CacheType>, 
    clarificationQueue: any[], 
    selectedRequest: any, 
    clarificationResponse: Message
) {
    // Perform tone analysis
    const toneAnalysis = await analyzeTone(clarificationResponse.content);
    const finalTone = toneAnalysis || "Neutral";

    const requester = await interaction.client.users.fetch(selectedRequest.requesterId);

    // Notify the requester about the clarification result
    await requester.send(`Requested Tone Clarification for message "${selectedRequest.content}": "${finalTone}"`);

    // Mark the specific request as clarified
    selectedRequest.isClarified = true;
    await interaction.client.users.send(selectedRequest.clarifierId, "Thank you! The clarification has been submitted.");

    // Remove the clarified request from the queue
    const index = clarificationQueue.findIndex(req => req.messageId === selectedRequest.messageId);
    if (index !== -1) {
        clarificationQueue.splice(index, 1);
    }

    // Recursively process remaining requests
    await processQueue(interaction, clarificationQueue);
}



// Clarification queue store
const clarificationQueueStore: { [key: string]: any[] } = {};

// Function to get or initialize the queue for a user
function getClarificationQueue(userId: string): any[] {
    if (!clarificationQueueStore[userId]) {
        clarificationQueueStore[userId] = [];
    }
    return clarificationQueueStore[userId];
}