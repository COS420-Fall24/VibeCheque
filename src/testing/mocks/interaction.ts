import { CacheType, ChatInputCommandInteraction } from "discord.js";

export function mockSlashCommandInteraction(command: string): ChatInputCommandInteraction<CacheType> {
	const interaction = Reflect.construct(ChatInputCommandInteraction<CacheType>, [])

	return interaction;
}