import { Client, CommandInteraction } from "discord.js";

export interface Command {
    name : string;
    execute(client : Client, interaction : CommandInteraction) : Promise<void>;
}

export interface Subcommand extends Command {
    parent : CommandWithSubcommand;
}

export interface CommandWithSubcommand extends Command {
    subcommands : Subcommand[];
    execute(client : Client, interaction : CommandInteraction) : Promise<void>
}