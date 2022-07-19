import { getModelForClass, prop, Ref } from "@typegoose/typegoose";
import mongoose from "mongoose";
import './loadEnv';


export async function connect() {
    await mongoose.connect(process.env.DB_HOST!!, { user : process.env.DB_USER, pass : process.env.DB_PW, dbName : process.env.DB_NAME} );
    console.log(`Connected to mongo ${mongoose.connection.db.databaseName} database`);
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