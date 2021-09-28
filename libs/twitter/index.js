const Axios = require('axios');
const Twit = require('twit');
let config;
const { HANDLE_WRITE_RESPONSE_TO_FILE } = require('../../misc/index');
const {screen_name} = require('../../misc/utils');
const { User } = require('../model');
if (process.env.NODE_ENV !== 'production') {
    config = require('../config').twitter_envs
} else {
    config = {
        consumer_key: process.env.TELEGRAM_BOT_CONSUMER_KEY,
        consumer_secret: process.env.TELEGRAM_BOT_CONSUMER_SECRET,
        access_token: process.env.TELEGRAM_BOT_ACCESS_TOKEN,
        access_token_secret: process.env.TELEGRAM_BOT_ACCESS_TOKEN_SECRET,
    }
};


const Twitter = new Twit(config);

let media_files = [];
let tweet;
let message_id;

const randomNegativeResponse = [
    `oops!! there was a problem processing your request, do check out @${screen_name} pinned post for the correct format of making a call ,  \nDo have a wonderful day🤗`,
    `Error 404!🤗, I could not find your telegram account in my store, do check out @${screen_name} pinned post for the correct format of making a call. \nHope to see you around.`
];


exports.GET_TWEET_DETAILS = async (message, HANDLE_SEND_MESSAGE, HANDLE_EDIT_MESSAGE, response,HANDLE_SEND_VIDEO) => {

    try {

        const reg = /https?:\/\/twitter.com\/[0-9-a-zA-Z_]{1,20}\/status\/([0-9]*)/
        const tweet_id = message.text.match(reg)[1]
        message_id = message.message_id
        const { data } = await Twitter.get(`statuses/show/${tweet_id}`);
        tweet = data;
        let buttons = [];
        if (data.extended_entities && data.extended_entities.media[0].type == "video") {

        

            const media_files = data.extended_entities.media[0].video_info.variants.filter(file => file.content_type == "video/mp4");
            const greatest_bitrate = media_files.sort((fileA, fileB) => fileB.bitrate - fileA.bitrate)[0]

            const options = {
                caption: `Hi, here's the video you requested.\n\n - - - \n\n  @DownloadThisVidBot`
            };

            await HANDLE_SEND_VIDEO(response.chat.id, greatest_bitrate.url, options);
           



        } else {

            HANDLE_EDIT_MESSAGE(`Hi @${message.from.first_name || message.from.username},\n⚠️ This Tweet does not contain a video.`, {
                chat_id: response.chat.id,
                message_id: response.message_id,
                reply_markup: {
                    inline_keyboard: buttons
                }
            })


        }

    } catch (error) {
        HANDLE_SEND_MESSAGE(message.chat.id, `Hi @${message.from.first_name || message.from.username},\n⚠️ Sorry, Something went wrong.`, { reply_to_message_id: message.message_id })
        console.log(error)
    }
};




const refrenced_tweet_ids = [];
let mentions = [];

exports.HANDLE_GET_BOT_MENTIONS = async (last_tweet_id, HANDLE_SEND_VIDEO) => {
    try {
        const options = { count: 50 };

        if (last_tweet_id) {
            options.since_id = last_tweet_id;
        };


        const BotTimeline = await HANDLE_GET_BOT_TIMELINE();


        const { data } = await Twitter.get('statuses/mentions_timeline', options);
        mentions = data;
        await data.forEach(async tweet => {


            const isTweetAMention = await HANDLE_VALIDATE_MENTION(tweet);

            const HaveIReplied = BotTimeline.find(t => t.in_reply_to_status_id_str === tweet.id_str);



            if (isTweetAMention && !HaveIReplied) {

                refrenced_tweet_ids.push(tweet.in_reply_to_status_id_str);


            };




        });

        // console.log(refrenced_tweet_ids)
        const refrenced_tweets = await HANDLE_GET_REFERENCED_TWEET(refrenced_tweet_ids)
        //Work on the tweet
        HANDLE_EXTRACT_VIDEO_FROM_TWEET(refrenced_tweets, HANDLE_SEND_VIDEO)
        // HANDLE_WRITE_RESPONSE_TO_FILE('misc/examples/valid_metions.js', tweet);
    } catch (error) {
        console.log(error);
    };


};

/**
 * @description Check if a tweet is a reply and not a reply to the bot.
 * @param {Object} tweet 
 * @returns {Boolean}
 */
const HANDLE_VALIDATE_MENTION = async (tweet) => {

    try {

        if (tweet.in_reply_to_status_id_str && tweet.in_reply_to_screen_name !== screen_name) {
            return true;
        } else {
            return false;
        }

    } catch (error) {

        return false;
    }
};


/**
 * 
 * @returns {Object} Tweets
 */
const HANDLE_GET_BOT_TIMELINE = async () => {
    try {
        const options = {
            screen_name: screen_name,
            include_rts: false,
            count: 200,
            exclude_replies: false
        };

        const { data } = await Twitter.get('statuses/user_timeline', options);

        return data;
    } catch (error) {
        throw error;
    }
};



/**
 * 
 * @param {Array} tweet_ids 
 * @returns {Array} Tweets
 */
const HANDLE_GET_REFERENCED_TWEET = async (tweet_ids) => {
    try {
        const options = {
            id: tweet_ids,
            tweet_mode: 'extended'
        }
        const { data } = await Twitter.get('statuses/lookup', options);
        // console.log(data)
        return data;
    } catch (error) {

        console.log(error)

    }
};

/**
 * 
 * @param {Array} tweets 
 * @param {Function} HANDLE_SEND_VIDEO 
 */
const HANDLE_EXTRACT_VIDEO_FROM_TWEET = async (tweets, HANDLE_SEND_VIDEO) => {
    try {

        let buttons = [];

        const tweets_with_vid = tweets.filter(tweet => tweet.extended_entities && tweet.extended_entities.media[0].type == "video");

        if (tweets_with_vid.length !== 0) {
            tweets_with_vid.forEach(async referenced_tweet => {
                const the_mention = mentions.find(mention => mention.in_reply_to_status_id_str === referenced_tweet.id_str);
                const data = {
                    referenced_tweet,
                    the_mention
                };

                const media_files = referenced_tweet.extended_entities.media[0].video_info.variants.filter(file => file.content_type == "video/mp4");
                // const sorted = files.sort((a,b)=> b.bitrate - a.bitrate)
                const greatest_bitrate = media_files.sort((fileA, fileB) => fileB.bitrate - fileA.bitrate)[0]

                const options = {
                    caption: `Hi @${the_mention.user.screen_name}, here's the video you requested from Twitter.\n\n - - - \n\n  @DownloadThisVidBot`
                };
                //Check if the user is in the DB
                const user = await User.findOne({'twitter_info.user_id':the_mention.user.id_str});

                if(user && user.twitter_info.info_verified){

                    let chatId = user.telegram_user_id;//Get user info from DB.
                await HANDLE_SEND_VIDEO(chatId, greatest_bitrate.url, options);

                  return await  HANDLE_REPLY_A_TWEET(the_mention.id_str,`Hello @${the_mention.user.screen_name},\nThis Video has been sent to your telegram account.`)
    
    
                };
                if(user && !user.twitter_info.info_verified){

                }

                console.log('User Not Found for this tweet',the_mention.user)
                

            });
        };








        // } 
    } catch (error) {
        console.log(error)
    }
};


/**
 * 
 * @param {String} user_id 
 * @param {String} message 
 */
exports.HANDLE_SEND_DIRECT_MESSAGE = async (user_id, message) => {
    try {

        const options = {
            event: {
                type: "message_create",
                message_create: {
                    target: {
                        recipient_id: user_id
                    },
                    message_data: {
                        text: message
                    }
                }
            }
        };
        await Twitter.post('direct_messages/events/new', options);

        // console.log(response)
    } catch (error) {
        console.log(error.twitterReply)
    }
};

/**
 * 
 * @param {String} screen_name 
 * @returns {Object} user
 */
exports.LOOK_UP_USER_BY_SCREEN_NAME = async (screen_name) => {
    try {
        const { data } = await Twitter.get('users/lookup', { screen_name });
        if (data.length !== 0) {
            return data[0];
        } else {
            return {};
        }


    } catch (error) {
        console.log(error)
    }
};


/**
 * 
 * @param {String} tweet_id 
 * @param {String} message 
 */
const HANDLE_REPLY_A_TWEET = async (tweet_id,message) => {
    try {

        const options = {
            in_reply_to_status_id: tweet_id,
            auto_populate_reply_metadata: true,
            status:message
        }

        await Twitter.post('statuses/update',options)

    } catch (error) {
        console.log(error)
    }
};