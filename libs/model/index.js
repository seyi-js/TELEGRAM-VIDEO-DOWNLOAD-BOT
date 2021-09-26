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

    downloaded_media: [
        {
            type: ObjectId,
            ref: 'medias',
        }
    ]
},{timestamps:true});


const MediaSchema = new mongoose.Schema({
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


exports.User = mongoose.model('users', UserSchema);
exports.Media = mongoose.model('medias',MediaSchema);
