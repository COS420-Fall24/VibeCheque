import "dotenv/config";
import { REST, Routes, ApplicationCommandOptionType, SlashCommandBuilder } from "discord.js";

// define a ts type for discord commands
declare type command = {
    name: string;
    description?: string;
    options?: {
        name: string,
        description?: string, 
        type: ApplicationCommandOptionType,
        required: boolean
    }[];
    type: number;
};

/**
 * Discord requires that you register slash commands before use, so discord servers know
 * how to autofill them on the client side (and to limit how many you use, I believe).
 *
 * This function handles all of the required api calls to register the bot's commands.
 * @param commands An array of commands to be registered
 */
export async function updateCommands(commands: command[]): Promise<void> {
    // discord.js handles api endpoints for us with the REST object
    const rest = new REST({ version: "10" }).setToken(
        process.env.DISCORD_TOKEN as string,
    );

    // attempt to push the new commands to discord
    try {
        console.log("refreshing commands");

        await rest.put(
            Routes.applicationCommands(process.env.APP_ID as string),
            { body: commands },
        );

        console.log("reloaded commands");
    } catch (error) {
        console.log(`app id: ${process.env.APP_ID}`);
        throw error;
    }
}

// enter the data for each command the bot should register here
updateCommands([
    {
        name: "ping",
        description: 'test bot and return "pong"',
        type: 1,
    },
    {
        name: "list-tones",
        description: "lists a sample of tones and their description",
        type: 1,
    },
    {
        name: "mood",
        description: "Sets the user's current mood",
        options: [
            {
                name: "currentmood",
                description: "The mood to be set",
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ],
        type: 1
    },
    {
        name: "embed",
        description: "test embed feature of discord",
        type: 1,
    },
    {
        name: "Tone",
        type: 3,
    },
    {
        name: "Add Tone",
        type: 3,
    },
    {
        name: "Clarify",
        type: 3,
    },
    {
        name: "In-Depth Clarification",
        type: 3,
    },
    {
        name:"Request Anonymous Clarification",
        type: 3,
    },
    {
        name: "togglebot",
        description: "Enable or Disable VibeCheque for this server",
        type: 1,
    },
    {
        name:"toggledms",
        description: "Enable or Disable DM's from VibeCheque",
        type:1
    }
]);