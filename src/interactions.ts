import { Client, CacheType, ChatInputCommandInteraction, EmbedBuilder, 
    MessageContextMenuCommandInteraction, SlashCommandBuilder } from "discord.js";
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

            const clarificationQueue = getClarificationQueue(targetMessage.author.id); //function doesn't exist yet
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

    let clarificationMessage = "You have the following pending clarification requests:\n";
    clarificationQueue.forEach((request, index) => {
        clarificationMessage += `${index + 1}. Message: "${request.content}" (ID: ${request.messageId})\n`;
    });

    await clarifier.send(clarificationMessage);
}

//function to go through the queue 
async function processQueue(interaction: MessageContextMenuCommandInteraction<CacheType>, clarificationQueue: any[]) {
    const unclarifiedRequests = clarificationQueue.filter(request => !request.isClarified);

    if (unclarifiedRequests.length > 0) {
        await notifyClarifier(interaction.client, unclarifiedRequests[0].clarifierId, unclarifiedRequests);
    }

    for (const currentRequest of unclarifiedRequests) {
        const clarifier = await interaction.client.users.fetch(currentRequest.clarifierId);
        const filter = (response: any) =>
            response.author.id === clarifier.id && response.channelId === clarifier.dmChannel?.id;

        const collector = clarifier.dmChannel?.createMessageCollector({ filter });

        collector?.on("collect", async (clarificationMessage) => {
            if (currentRequest.isClarified) return;

            const toneAnalysis = await analyzeTone(clarificationMessage.content);
            const requester = await interaction.client.users.fetch(currentRequest.requesterId);

            await requester.send(
                `Requested Tone Clarifcation for message "${currentRequest.messageId}": "${toneAnalysis}"`
            );

            currentRequest.isClarified = true;
            collector.stop();


        });


    }
}


function getClarificationQueue(userId: string): any[]{
    if(!clarificationQueueStore[userId]){
        clarificationQueueStore[userId] = [];
    }
    return clarificationQueueStore[userId];
}

const clarificationQueueStore: {[key: string]: any[]} = {};