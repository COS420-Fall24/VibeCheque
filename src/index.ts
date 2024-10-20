import launchBot from "./discordApp"
import { command, updateCommands } from "./registerCommands"

const commands: command[] = [
	{
			name: "ping",
			description: 'test bot and return "pong"',
			type: 1,
	},
];

await updateCommands(commands);
await launchBot();