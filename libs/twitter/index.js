let config;

const {screen_name} = require('../../misc/utils');
const {HANDLE_EXTRACT_VIDEO_FROM_TWEET,HANDLE_GET_BOT_TIMELINE,HANDLE_GET_REFERENCED_TWEET,HANDLE_REPLY_A_TWEET,HANDLE_VALIDATE_MENTION,HANDLE_SEND_DIRECT_MESSAGE,IS_PROCESSED} = require('./utils/')()




const Twitter = require('./auth').AUTH()

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
                caption: `Hi, here's the video you requested.\n\n - - - \n\n  @${screen_name}`
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



exports.HANDLE_GET_BOT_MENTIONS = async (last_tweet_id, HANDLE_SEND_VIDEO) => {
    const refrenced_tweet_ids = [];
    let mentions = [];
    try {
        const options = { count: 50 };

        if (last_tweet_id) {
            options.since_id = last_tweet_id;
        };


        const BotTimeline = await HANDLE_GET_BOT_TIMELINE(screen_name,Twitter);


        const { data } = await Twitter.get('statuses/mentions_timeline', options);
        mentions = data;
        await data.forEach(async tweet => {


            const isTweetAMention = await HANDLE_VALIDATE_MENTION(tweet);

            const HaveIReplied = BotTimeline.find(t => t.in_reply_to_status_id_str === tweet.id_str);

            const isProcessed = await IS_PROCESSED(tweet.in_reply_to_status_id_str);

            

            if (isTweetAMention && !HaveIReplied) {

                // console.log(tweet)

                refrenced_tweet_ids.push(tweet.in_reply_to_status_id_str);

                // console.log(tweet)
                
            };




        });

        // console.log(refrenced_tweet_ids)
        const refrenced_tweets = await HANDLE_GET_REFERENCED_TWEET(refrenced_tweet_ids)
        //Work on the tweet
        HANDLE_EXTRACT_VIDEO_FROM_TWEET(refrenced_tweets, HANDLE_SEND_VIDEO,mentions)
        // HANDLE_WRITE_RESPONSE_TO_FILE('misc/examples/valid_metions.js', tweet);
    } catch (error) {
        console.log('FROM HANDLE BOT MENTIONS',error);
    };


};










