import { EmbedBuilder } from "@discordjs/builders";
import { Client, Intents, Interaction, MessageActionRow, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import { connect, QuestModel, UserModel } from "./database";
import { logger } from './config/winston';

import config from './config';

const client = new Client({
    intents : [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ],
    partials : [
        "CHANNEL"
    ]
});

const DISCORD_GUILD = config.DISCORD_GUILD!!;
const DISCORD_CHANNEL = config.DISCORD_CHANNEL!!;

client.once("ready", () => {
    logger.info("Ready!")
})


client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    switch (commandName) {
        case 'ping' : await interaction.reply("pong!"); break;
        case 'signin' : {
            if (!await UserModel.findOne({discordId : interaction.user.id})) {
                const user = await UserModel.create({discordId : interaction.user.id, minecraftId : interaction.options.getString("mcname")!});
            
                await user.save()
                await interaction.reply({ embeds : [new EmbedBuilder().setTitle("유저 생성됨").setDescription(`${user.discordId} | ${user.minecraftId}`).toJSON()] });
                logger.info(`User(_id : ${user._id.toString()}) created`)
                break;
            } else {
                await interaction.reply("이미 유저가 있습니다.");
                break;
            }

        }
        case 'quest' : {
            const subcommandName = interaction.options.getSubcommand()
            logger.info(`Command quest.${subcommandName} recieved.`)
            switch (subcommandName) {
                case 'publish' : {
                    const user = await UserModel.findOne({discordId: interaction.user.id})
                    if (user) {
                        const quest = await QuestModel.create({
                            title : interaction.options.getString("title"),
                            content : interaction.options.getString("content"),
                            userLimit : interaction.options.getBoolean("unlimited", true),
                            requestor : user,
                            worker : [],
                            reward : interaction.options.getString("reward") ?? "none"
                        })
                        await quest.save();
                        logger.info(`New Quest(_id : ${quest._id.toString()}) created.`);
                        (await (await client.guilds.fetch(DISCORD_GUILD)).channels.fetch(DISCORD_CHANNEL) as TextChannel).send({
                            embeds : [
                                new EmbedBuilder()
                                    .setTitle(`${quest.title}`)
                                    .setAuthor({
                                        name : interaction.user.tag,
                                        iconURL : interaction.user.avatarURL() ?? undefined
                                    })
                                    .setDescription("마인크래프트 퀘스트")
                                    .setFields(
                                        // { name: '\u200B', value: '\u200B' },
                                        { name : "퀘스트 내용", value : quest.content, inline : true },
                                        { name : "퀘스트 보상", value : quest.reward, inline : true }
                                    )
                                    .toJSON()
                            ],
                            components : [
                                new MessageActionRow()
                                    .addComponents(
                                        new MessageButton()
                                            .setLabel("수락")
                                            .setStyle("SUCCESS")
                                            .setCustomId(`accept-quest-${quest._id}`)
                                    )
        
                            ]
                        })
        
                        interaction.reply("퀘스트 생성됨");
                        return;
                    }
                    interaction.reply("문제 발생")
                    break;
                }
                case 'mine' : {
                    const user = await UserModel.findOne({discordId: interaction.user.id})
                    if (user) {
                        const joinedQuests = await QuestModel.find({ 'worker' : { $gt : user._id }, isCompleted : false });
                        const createdQuests = await QuestModel.find({ 'requestor' : user._id, isCompleted : false});
                        
                        const stringChangeFunction = (quests : Array<any>) => {
                            const str = quests.map(quest => `${quest.title}[${quest._id.toString()}] (${quest.worker.length}명 참가중)`).join('\n')
                            if (str.trim() == "") {
                                return "없음"
                            } else return str;
                        }

                        const embed = new MessageEmbed()
                            .setTitle(`${user.minecraftId}(${interaction.user.tag})님의 퀘스트`)
                            .setDescription(`생성된 퀘스트 ${createdQuests.length}건, 참여중인 퀘스트 ${joinedQuests.length}건`)
                            .addField(
                                '생성된 퀘스트', stringChangeFunction(createdQuests)
                            )
                            .addField(
                                '참여중인 퀘스트', stringChangeFunction(joinedQuests)
                            )
                            .setAuthor({
                                name : interaction.user.tag,
                                iconURL : interaction.user.avatarURL() ?? undefined
                            })          
                        
                            
                        await interaction.reply({ embeds : [embed] });
                        break;
                    } else {
                        await interaction.reply("가입 먼저 해주세요")
                        break;
                    }
                }
                case 'complete' : {
                    const user = await UserModel.findOne({discordId: interaction.user.id})
                    if (user) {
                        const questId = interaction.options.getString("questid");
                        const quest = await QuestModel.findById(questId);
                        if (quest == null || quest == undefined) {
                            await interaction.reply("없는 퀘스트 입니다.")
                            return;
                        }
                        if (quest!.isCompleted) {
                            await interaction.reply("이미 완료됨 퀘스트 입니다.")
                            return;
                        }
                        if (quest!.requestor!.toString() == user._id.toString()) {
                            if (quest!.isCompleted) {
                                await interaction.reply("이미 완료됨 퀘스트 입니다.")
                                return;
                            }
                            quest!.isCompleted = true;
                            await quest!.save();
                            await interaction.reply('퀘스트 완료됨')
                            const workers : string[] = [];
                            for await (const worker of quest!.worker.map( worker =>  UserModel.findById(worker?.toString()))) {
                                workers.push(worker!.discordId);
                            }
                            
                            (await (await client.guilds.fetch(DISCORD_GUILD)).channels.fetch(DISCORD_CHANNEL) as TextChannel).send({
                                content : workers.map(worker => `<@${worker}>`).join(', '),
                                embeds : [
                                    new MessageEmbed()
                                        .setTitle("퀘스트 완료됨")
                                        .setDescription(`완료한 퀘스트 : ${quest!.title}[${quest!._id.toString()}]`)
                                ]
                            });
                        } else {
                            await interaction.reply("자신의 퀘스트가 아닙니다.");
                        }
                        break;
                    }
                    await interaction.reply("오류")
                    break;
                }
            }
        }
    }
})


client.on('interactionCreate', async (i: Interaction) => {
    if (!i.isButton()) return;

    logger.info(`User(discord : ${i.user.id}) clicked Button.`)

    if (i.customId.includes('accept-quest-')) {
        logger.info(`User(discord ${i.user.id}) clicked Quest Button.`)
        const questId = i.customId.split("-").at(2);
        const quest = (await QuestModel.findById(questId))
        
        if (!quest) {
            await i.reply({ content : "Error Occured", ephemeral : true });
            logger.info(`Cannot find quest.`)
        }

        logger.info(`Quest(_id : ${quest?._id.toString()}) Found.`);

        const user = await UserModel.findOne({discordId : i.user.id})
        if (quest!.isCompleted) {
            logger.info("Quest Already Completed.")
            await i.update({ components : [new MessageActionRow().addComponents(
                new MessageButton().setLabel("수락 불가").setStyle("DANGER").setCustomId(`ended-quest-${questId}`).setDisabled(true)
            )]})
        }
        if (user) {
            // 아이디가 있다.
            const isAlreadyAccepted = quest?.worker.includes(user._id);

            if (!isAlreadyAccepted) {
                quest!.worker.push(user);
                quest!.save();
                logger.info("User accepted the quest.")
                await i.reply({ content : `${user.minecraftId}(${i.user.tag})님이 퀘스트를 수락하셨어요!`});
            } else {
                await i.reply({ content : `이미 수락하셨어요`, ephemeral : true})
            }

        } else {
            // 없다
            logger.info("User not found in database.")
            await i.reply({ content : "/signin을 먼저 해주세요", ephemeral : true});
        }

        return;
    }
});


connect().then(() => {
    logger.info("Starting the application...")
    client.login(config.DISCORD_TOKEN)
})


