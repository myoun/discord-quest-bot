import { ButtonInteraction, Client, Intents, MessageActionRow, MessageButton } from 'discord.js';
import { logger } from './config/winston';
import config from './config/config';
import { PingCommand } from './command/ping.command';
import { QuestCommand } from './command/quest.command';
import { SignInCommand } from './command/signin.command';
import { connect, QuestModel, UserModel } from './database';

const client = new Client({
    intents : [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ],
    partials : [
        "CHANNEL"
    ]
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
        case "ping" : await new PingCommand().execute(client, interaction); break;
        case "quest" : await new QuestCommand().execute(client, interaction); break;
        case "signin" : await new SignInCommand().execute(client, interaction); break;
    }
    
})

const acceptQuest = async (interaction: ButtonInteraction) => {
    logger.info(`User(discord ${interaction.user.id}) clicked Quest Button.`)
    const questId = interaction.customId.split("-").at(2);
    const quest = (await QuestModel.findById(questId))
    
    if (!quest) {
        await interaction.reply({ content : "Error Occured", ephemeral : true });
        logger.info(`Cannot find quest.`)
    }

    logger.info(`Quest(_id : ${quest?._id.toString()}) Found.`);

    const user = await UserModel.findOne({discordId : interaction.user.id})
    if (quest!.isCompleted) {
        logger.info("Quest Already Completed.")
        await interaction.update({ components : [new MessageActionRow().addComponents(
            new MessageButton().setLabel("수락 불가").setStyle("DANGER").setCustomId(`ended-quest-${questId}`).setDisabled(true)
        )]})
    }
    if (user) {
        const isAlreadyAccepted = quest?.worker.includes(user._id);

        if (!isAlreadyAccepted) {
            quest!.worker.push(user);
            quest!.save();
            logger.info("User accepted the quest.")
            await interaction.reply({ content : `${user.minecraftId}(${interaction.user.tag})님이 퀘스트를 수락하셨어요!`});
        } else {
            await interaction.reply({ content : `이미 수락하셨어요`, ephemeral : true})
        }

    } else {
        logger.info("User not found in database.")
        await interaction.reply({ content : "/signin을 먼저 해주세요", ephemeral : true});
    }
}


client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    logger.info(`User(discord : ${interaction.user.id}) clicked Button.`)

    if (interaction.customId.includes('accept-quest-')) {
        acceptQuest(interaction);
        return;
    }
})

connect().then(() => {
    logger.info("Starting the application...")
    client.login(config.DISCORD_TOKEN)
})