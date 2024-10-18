import "dotenv/config";
import { REST, Routes } from "discord.js";

declare type command = {
    name: string;
    description: string;
    type: number;
};

async function updateCommands(): Promise<void> {
    const commands: command[] = [
        {
            name: "ping",
            description: 'test bot and return "pong"',
            type: 1,
        },
    ];

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
        console.error(error);
    }
}

export default updateCommands;
