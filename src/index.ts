import launchBot from "./discordApp"
import registerCommands from "./registerCommands"

await registerCommands();
await launchBot();