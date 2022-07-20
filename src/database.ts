import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import { logger } from "./config/winston";
import mongoose from "mongoose";
import config from './config/config';


export async function connect() {
    await mongoose.connect(config.DB_HOST!!, { user : config.DB_USER, pass : config.DB_PW, dbName : config.DB_NAME} );
    logger.info(`Connected to mongo ${mongoose.connection.db.databaseName} database`);
    return mongoose
}


export class User {

    @prop({ required : true })
    public discordId! : string
    
    @prop({ required : true })
    public minecraftId! : string
}

export class Quest {

    @prop({ required : true })
    public title! : string

    @prop({ required : true})
    public content! : string

    @prop({ required : true , ref: () => User})
    public requestor! : Ref<User>

    @prop({ required : true, ref: () => Quest})
    public worker! : Ref<User>[]

    @prop({ required : true})
    public userLimit! : boolean;

    @prop({ required : true} )
    public reward! : string;

    @prop({ required : true, default : false })
    public isCompleted! : boolean;
}

export const UserModel = getModelForClass(User);
export const QuestModel = getModelForClass(Quest);