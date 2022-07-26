import { SlashCommandBuilder, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from 'discord-api-types/v9'
import config from './src/config/config';

const commands = [
    new SlashCommandBuilder().setName("ping").setDescription("Ping it!"),
    new SlashCommandBuilder()
        .setName("signin")
        .setDescription("sign in"),
    new SlashCommandBuilder()
        .setName("quest")
        .setDescription("quest!")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("publish")
                .setDescription("create quest")
                .addStringOption(option => option.setName('title').setNameLocalization("ko", "제목").setDescription('quest title').setRequired(true))
                .addStringOption(option => option.setName('content').setNameLocalization("ko", "내용").setDescription('quest content').setRequired(true))
                .addBooleanOption(option => option.setName('unlimited').setNameLocalization("ko", "제한여부").setDescription('member limit (if true, unlimited)').setRequired(true))
                .addStringOption(option => option.setName('reward').setNameLocalization('ko', '보상').setDescription('quest reward').setRequired(false)),
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("mine")
                .setDescription("see my quest")
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("complete")
                .setDescription('complete quest')
                .addStringOption(option => option.setName('questid').setDescription('quest id').setRequired(true))
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
                .setName("cancel")
                .setDescription("cancel quest registration")
        
        )
    ].map(command => command.toJSON())


console.log(commands);

const rest = new REST({ version : '9' }).setToken(config.DISCORD_TOKEN!!);

rest.put(Routes.applicationGuildCommands(config.DISCORD_APPLICATION_ID!!, config.DISCORD_GUILD!!), { body : commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);