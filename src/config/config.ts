import dotenv from 'dotenv';
import joi from 'joi';

dotenv.config();

const envVarSchema = joi.object()
    .keys({
        DB_HOST : joi.string().required(),
        DB_USER : joi.string().required(),
        DB_PW : joi.string().required(),
        DB_NAME : joi.string().required(),
        DISCORD_TOKEN : joi.string().required(),
        DISCORD_GUILD : joi.string().required(),
        DISCORD_CHANNEL : joi.string().required(),
        DISCORD_APPLICATION_ID : joi.string().required(),
    })
    .unknown();

const { value : envVars, error } = envVarSchema
    .prefs({ errors : { label : "key" }})
    .validate(process.env);

if (error) {
    throw new Error('Config Validation error : '+error.message);
}

export default process.env