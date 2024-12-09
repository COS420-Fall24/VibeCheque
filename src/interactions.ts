import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType,
    ChatInputCommandInteraction, ComponentType, EmbedBuilder, MessageContextMenuCommandInteraction, 
    SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { analyzeTone, emojiRepresentation, explanationOfTone } from "./gptRequests";
import db from './firebase'; // Import from your firebase.ts file
import { ref, set, get, child } from "firebase/database";
//getTones and Clarify rely on toneJSON. Implementing it in firebase would be better
//import toneJSON from "./tones.json" assert { type: "json"};

export interface Tone {
    name: string;
    description: string;
    indicator: string;
}

//Import tones from tones.json
const tones: Tone[] = require("./tones.json").tones;

export async function mood(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    var currentMood = interaction.options.get('currentmood')?.value!.toString();
    var oldMood = "";

    // Get the old mood from database
    var dbRef = ref(db);
    get(child(dbRef, 'servers/' + interaction.guildId + '/username/' + interaction.user.id)).then((snapshot) => {
        if (snapshot.exists()) {
            oldMood = snapshot.val()["mood"]
        } else {
          console.log("No data available");
        }
      }).catch((error) => {
        console.error(error);
     });

    // delete the old mood from roles
    if (interaction.guild?.roles.cache.find(role => role.name === oldMood)) {
        let guild = interaction.guild!;
        let role = guild.roles.cache.find((r) => r.name === currentMood);
        let member = await guild.members.fetch(interaction.user.id);
        member.roles.remove(role!);
    } else {
        let guild = interaction.guild!;
        await guild.roles.create({name: currentMood})
        let role = guild.roles.cache.find((r) => r.name === oldMood);
        let member = await guild.members.fetch(interaction.user.id);
        member.roles.remove(role!);
    }

    // set the new mood in database
    set(ref(db, 'servers/' + interaction.guildId + '/username/' + interaction.user.id), {
        mood: currentMood,
        timestamp: interaction.createdTimestamp
    });

    // update new role
    if (interaction.guild?.roles.cache.find(role => role.name === currentMood)) {
        let guild = interaction.guild!;
        let role = guild.roles.cache.find((r) => r.name === currentMood);
        let member = await guild.members.fetch(interaction.user.id);
        member.roles.add(role!);
    } else {
        let guild = interaction.guild!;
        await guild.roles.create({name: currentMood})
        let role = guild.roles.cache.find((r) => r.name === currentMood);
        let member = await guild.members.fetch(interaction.user.id);
        member.roles.add(role!);
    }

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

export async function action(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    //Builds the menu
    const select = new StringSelectMenuBuilder()
        .setCustomId('example')
        .setPlaceholder('select an option')
        .addOptions(
            //Build the option:
            //Has a label (setLabel), description (setDescription), value (setValue), emoji (setEmoji), and can be set to selected by default (setDefault)
            new StringSelectMenuOptionBuilder()
                .setLabel('Option 1 Label')
                .setDescription('Option 1 Description')
                .setValue('Option 1 Value'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Option 2 Label')
                .setDescription('Option 2 Description')
                .setValue('Option 2 Value'),
            new StringSelectMenuOptionBuilder()
                .setLabel('Option 3 Label')
                .setDescription('Option 3 Description')
                .setValue('Option 3 Value'),
        );
    
    //Buttons have five different styles, primary, secondary, success, danger, and link
    //Each button has a customId, label, style, link, and emoji (SKUid doesn't really apply to our project)
    //A button can also be set to disabled by default
    const primary = new ButtonBuilder()
        .setCustomId('primary')
        .setLabel('Primary Button')
        .setStyle(ButtonStyle.Primary);

    const secondary = new ButtonBuilder()
        .setCustomId('secondary')
        .setLabel('Secondary Button')
        .setStyle(ButtonStyle.Secondary);

    const success = new ButtonBuilder()
        .setCustomId('success')
        .setLabel('Success Button')
        .setStyle(ButtonStyle.Success);

    const danger = new ButtonBuilder()
        .setCustomId('danger')
        .setLabel('Danger Button')
        .setStyle(ButtonStyle.Danger);
    
    //Important! URL and CustomID are mutually exclusive
    const link = new ButtonBuilder()
        .setLabel('Link Button')
        .setURL('https://discordjs.guide/message-components/buttons.html#button-styles')
        .setStyle(ButtonStyle.Link);
    
    //row1 and row2 are the rows of a message, there can be up to five rows, each with five maximum elements
    //Select menus have a width value of 5, while buttons have a width of 1
    const row1 = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(select);

    const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(primary, secondary, success, danger, link);

    const response = await interaction.editReply({
        content: 'An example select menu',
        components: [row1, row2],
    });

    //This filter ensures that only the user who issued the command can press the buttons
    const collectorFilter = (i: { user: { id: string; }; }) => i.user.id === interaction.user.id;

    //this approach works to collect only one interaction
    /*try {
        const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000});

        switch (confirmation.customId) {
            case 'primary':
                await confirmation.update({ content: `${interaction.user.displayName} has pressed the primary button`, components: [] });
                break;
            case 'secondary':
                await confirmation.update({ content: `${interaction.user.displayName} has pressed the secondary button`, components: [] });
                break;
            case 'success':
                await confirmation.update({ content: `${interaction.user.displayName} has pressed the success button`, components: [] });
                break;
            case 'danger':
                await confirmation.update({ content: `${interaction.user.displayName} has pressed the danger button`, components: [] });
                break;
        }
    } catch (e) {
        await interaction.editReply({ content: 'No interaction for the last minute, cancelling interaction', components: [] });
    }*/

    const collector = response.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.Button, time: 180_000});

    //For each interaction with the components of componentType, do the following
    collector.on('collect', async i => {
        const selection = i.customId;
        await i.reply(`${i.user} has selected ${selection}!\n`)
    });
}

//This should be an application command (need to select message to add tone to)
//This kinda adds tone, but it's super lame as it's only a reaction
export async function postemptiveToneAdd(interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    //copy-paste select menu for tones:
    //create the tone menu which allows a user to select 1-5 tones
    const toneMenu = new StringSelectMenuBuilder()
        .setCustomId('tone select menu')
        .setPlaceholder('Select a tone')
        .setMinValues(1)
        .setMaxValues(5);

    //For each tone in toneJson.tones, we create a new option for our tone menu
    tones.forEach((tone: Tone) => {
        toneMenu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setValue(`${tone.name} (${tone.indicator})`)
                .setLabel(`${tone.name}: ${tone.indicator}`)
                .setDescription(`${tone.description}`),
        );
    });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(toneMenu);

    //await the promise and edit the reply with the following
    //row is the actionRow which hold the select menu
    const response = await interaction.editReply({
        content: 'Here is a list of tones: ',
        components: [row],
    });

    //creates a filter that only allows the user who sent the interaction to edit it
    //Need to make sure the author is the only one who can add tones
    const collectorFilter = (i: {user: {id: string}; }) => i.user.id === interaction.targetMessage.author.id;

    //creates a collector with the filter above that times out in three minutes
    const collector = response.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 180_000});

    //edit the reply to say what the user selected
    collector.on('collect', async i => {
        const selection = i.values;
        //rather than form a reply, the bot should try to edit the user's message
        //TODO: make selection a string instead of a string[] using map/filter
        selection.forEach(async (currentValue: string) => {interaction.targetMessage.react(await emojiRepresentation(currentValue));});
        await response.delete();
    });
}

//A function which creates a select menu from the elements in tones.json for users to select
//This already covers the preexisting tone add
export async function getTones(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
    await interaction.deferReply();

    //create the tone menu which allows a user to select 1-5 tones
    const toneMenu = new StringSelectMenuBuilder()
        .setCustomId('tone select menu')
        .setPlaceholder('Select a tone')
        .setMinValues(1)
        .setMaxValues(5);

    //For each tone in toneJson.tones, we create a new option for our tone menu
    tones.forEach((tone: Tone) => {
        toneMenu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setValue(`${tone.name} (${tone.indicator})`)
                .setLabel(`${tone.name}: ${tone.indicator}`)
                .setDescription(`${tone.description}`),
        );
    });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(toneMenu);

    //await the promise and edit the reply with the following
    //row is the actionRow which hold the select menu
    const response = await interaction.editReply({
        content: 'Here is a list of tones: ',
        components: [row],
    });

    //creates a filter that only allows the user who sent the interaction to edit it
    const collectorFilter = (i: {user: {id: string}; }) => i.user.id === interaction.user.id;

    //creates a collector with the filter above that times out in three minutes
    const collector = response.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 180_000});

    //edit the reply to say what the user selected
    collector.on('collect', async i => {
        const selection = i.values;
        await interaction.editReply({
            content: `${interaction.user.displayName}, you have selected the following tones: ${selection}`,
            components: [],
        });
    });
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

//pop-out description cannot be done with discord's UI
//Cannot edit tones because of discord's UI
//The closest thing I can make to a pop-out description is an app command
//Maybe it should be like clarify but includes the message fragment, its tone, and an explanation
//The problem is it should be a pop-out for user convenience, this is NOT that. Something is better than nothing
export async function inDepthClarification(interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
    //is this seriously all?
    interaction.reply({
        ephemeral: true,
        content: await explanationOfTone(interaction.targetMessage.content)
    });
}

export async function clarify(interaction: MessageContextMenuCommandInteraction<CacheType>): Promise<void> {
    interaction.reply({
        ephemeral: true,
        content: "Thanks for pointing that out, I'll ask for you!"
    })

    //create the tone menu and add the options from toneJSON
    const toneMenu = new StringSelectMenuBuilder()
        .setCustomId('tone select menu')
        .setPlaceholder('Select a tone')
        .setMinValues(1)
        .setMaxValues(5);

    tones.forEach((tone: Tone) => {
        toneMenu.addOptions(
            new StringSelectMenuOptionBuilder()
                .setValue(` ${tone.name} (${tone.indicator})`)
                .setLabel(`${tone.name}: ${tone.indicator}`)
                .setDescription(`${tone.description}`),
        );
    });

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(toneMenu);

    if (interaction.channel?.isSendable()) {

        const request = await interaction.channel.send({
            content: `Hey there, ${interaction.targetMessage.author}! It seems I wasn't able to understand the tone in one of your messages:

> ${interaction.targetMessage.content.split('\n').join("\n> ")}

To help me learn, I was hoping you could clarify the tone of your message.
Here's a short list of tones, select up to five that apply:`,
        components: [row]});

        //create the filter and the collector
        const collectorFilter = (i: {user: {id: string}; }) => i.user.id === interaction.targetMessage.author.id;

        const collector = request.createMessageComponentCollector({ filter: collectorFilter, componentType: ComponentType.StringSelect, time: 180_000});

        //Get the response from the, reply to the target message the tones, and delete the request
        collector.on('collect', async i => {
            const selection = i.values;
            await interaction.targetMessage.reply({
                content: `This message was marked with the following tones: ${selection}`
            });
            await request.delete();
        });
    }
}