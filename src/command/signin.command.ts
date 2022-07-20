import { Client, CommandInteraction, MessageActionRow, Modal, ModalActionRowComponent, TextInputComponent } from "discord.js";
import { Command } from "./command";
import { logger } from "../config/winston";
import { ActionRowBuilder, EmbedBuilder, ModalActionRowComponentBuilder, ModalBuilder, TextInputBuilder } from "@discordjs/builders";
import { UserModel } from "../database";
import { TextInputStyle } from "discord-api-types/v9";

export class SignInCommand implements Command {
    name: string = "signin";

    public async execute(client: Client, interaction: CommandInteraction): Promise<void> {

        const modal = new Modal()
            .setTitle("가입")
            .setCustomId("signin-modal")
            
        const minecraftIdInput = new TextInputComponent()
            .setLabel("마인크래프트 ID")
            .setCustomId("minecraftId")
            .setStyle("SHORT")
            .setMaxLength(16)
            .setRequired(true)
        
        const actionRow = new MessageActionRow<TextInputComponent>().addComponents(minecraftIdInput)

        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
}