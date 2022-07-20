import { Client, CommandInteraction } from "discord.js";
import { Command } from "./command";

export class PingCommand implements Command {

    name: string = "ping";

    public async execute(client : Client, interaction : CommandInteraction): Promise<void> {
        await interaction.reply("pong!");
    }
}