import { Client, CommandInteraction, MessageActionRow, MessageButton, MessageEmbed, TextChannel } from "discord.js";
import { QuestModel, UserModel } from "../database";
import { Command, CommandWithSubcommand, Subcommand } from "./command";
import { logger } from "../config/winston";
import config from '../config/config';
import { EmbedBuilder } from "@discordjs/builders";

const DISCORD_GUILD = config.DISCORD_GUILD!!;
const DISCORD_CHANNEL = config.DISCORD_CHANNEL!!;

export class QuestCommand implements CommandWithSubcommand {
    name : string = "quest";
    subcommands : Subcommand[] = [new QuestPublishCommand(this), new QuestMineCommand(this), new QuestCompleteCommand(this)];

    public async execute(client: Client<boolean>, interaction: CommandInteraction): Promise<void> {
        const sc_name = interaction.options.getSubcommand()
        const subcommand = this.subcommands.find(sc => sc.name === sc_name)!!;
        subcommand.execute(client, interaction);
    }
}

class QuestPublishCommand implements Subcommand {
    name : string = "publish";
    
    constructor(public parent: CommandWithSubcommand) {}

    public async execute(client: Client<boolean>, interaction: CommandInteraction): Promise<void> {
        const user = await UserModel.findOne({discordId: interaction.user.id})
        if (user) {
            const quest = await QuestModel.create({
                title : interaction.options.getString("title"),
                content : interaction.options.getString("content"),
                userLimit : interaction.options.getBoolean("unlimited", true),
                requestor : user,
                worker : [],
                reward : interaction.options.getString("reward") ?? "none"
            });

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
        return;
    }
}

class QuestMineCommand implements Subcommand {
    name : string = "mine";
    
    constructor(public parent: CommandWithSubcommand) {}

    public async execute(client: Client<boolean>, interaction: CommandInteraction): Promise<void> {
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
            return;
        } else {
            await interaction.reply("가입 먼저 해주세요")
            return;
        }
    }
}

class QuestCompleteCommand implements Subcommand {
    name : string = "complete";
    
    constructor(public parent: CommandWithSubcommand) {}

    public async execute(client: Client<boolean>, interaction: CommandInteraction): Promise<void> {
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
            return;
        }
        await interaction.reply("오류")
        return;
    }
}