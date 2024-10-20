import launchBot from "./discordApp.js"
import { command, updateCommands } from "./registerCommands.js"

const commands: command[] = [
	{
			name: "ping",
			description: 'test bot and return "pong"',
			type: 1,
	},
];

await updateCommands(commands);
await launchBot();