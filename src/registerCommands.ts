import "dotenv/config";
import { REST, Routes } from "discord.js";

declare type command = {
    name: string;
    description?: string;
    type: number;
};

/**
 * Discord requires that you register slash commands before use, so discord servers know
 * how to autofill them on the client side (and to limit how many you use, I believe).
 *
 * This function handles all of the required api calls to register the bot's commands.
 * @param commands An array of commands to be registered
 */
async function updateCommands(commands: command[]): Promise<void> {
    // discord.js handles api endpoints for us with the REST object
    const rest = new REST({ version: "10" }).setToken(
        process.env.DISCORD_TOKEN as string,
    );

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

updateCommands([
    {
        name: "ping",
        description: 'test bot and return "pong"',
        type: 1,
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
        name: "Clarify",
        type: 3,
    },
    {
        name:"Request Anonymous Clarification",
        description: "Request anonymous clarification about a message",
        type: 3,
    }
]);