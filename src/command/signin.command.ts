import { Client, CommandInteraction } from "discord.js";
import { Command } from "./command";
import { logger } from "../config/winston";
import { EmbedBuilder } from "@discordjs/builders";
import { UserModel } from "../database";

export class SignInCommand implements Command {
    name: string = "signin";

    public async execute(client: Client, interaction: CommandInteraction): Promise<void> {
        if (!await UserModel.findOne({discordId : interaction.user.id})) {
            const user = await UserModel.create({discordId : interaction.user.id, minecraftId : interaction.options.getString("mcname")!});
        
            await user.save()
            await interaction.reply({ embeds : [new EmbedBuilder().setTitle("유저 생성됨").setDescription(`${user.discordId} | ${user.minecraftId}`).toJSON()] });
            logger.info(`User(_id : ${user._id.toString()}) created`)
            return;
        } else {
            await interaction.reply("이미 유저가 있습니다.");
            return;
        }
    }
}