const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new mongoose.Schema({
    telegram_username: {
        type: String,
        required: true,
        unique: true,
    },
    telegram_user_id: {
        type: String,
        required: true,
        unique: true,
    },

    isBlocked:{
        type:Boolean,
        default:false,
    },

    twitter_info:{
        user_id:{
            type:String,

        },
        screen_name:{
            type:String,
        },
        otp:{
            type:Number
        },

        info_verified:{
            type:Boolean,
            default:false
        },
        verification_attempt:{
            type:Number,
            default:0
        }

    },

    
},{timestamps:true});


const MediaSchema = new mongoose.Schema({
    tweet_id:{
        type:String
    },
    main_url:{
        type:String,
        unique:true,
        required:true
    },
    download_url:{
        type:String,
        required:true
    },

    source:{
        type:String,
        required:true
    }
},{timestamps:true});

const TwitterSchema= new mongoose.Schema({
    user_id:{
        type:String,
        unique:true
    },
    screen_name:{
        type:String,
        unique:true
    },
    downloaded_media: [
        {
            type: ObjectId,
            ref: 'medias',
        }
    ]
})

exports.User = mongoose.model('users', UserSchema);
exports.Media = mongoose.model('medias',MediaSchema);
exports.TwitterUser = mongoose.model('twitterusers',TwitterSchema);
