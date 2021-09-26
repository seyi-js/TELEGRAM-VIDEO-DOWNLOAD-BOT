const Axios = require('axios');
const Twit = require('twit');
let config;
if (process.env.NODE_ENV !== 'production') {
    config = require('../config').twitter_envs
} else {
    config = {
        consumer_key: process.env.QUOTE_CONSUMER_KEY,
        consumer_secret: process.env.QUOTE_CONSUMER_SECRET,
        access_token: process.env.QUOTE_ACCESS_TOKEN,
        access_token_secret: process.env.QUOTE_ACCESS_TOKEN_SECRET,
    }
};

const Twitter = new Twit(config);


let media_files =[];
let tweet;
let message_id;

exports.GET_TWEET_DETAILS = async (message, HANDLE_SEND_MESSAGE, HANDLE_EDIT_MESSAGE, response) => {

    try {
        const reg = /https?:\/\/twitter.com\/[0-9-a-zA-Z_]{1,20}\/status\/([0-9]*)/
        const tweet_id = message.text.match(reg)[1]
        message_id = message.message_id
        const { data } = await Twitter.get(`statuses/show/${tweet_id}`);
        tweet = data;
        let buttons = [];
        if (data.extended_entities && data.extended_entities.media[0].type == "video") {

            media_files = data.extended_entities.media[0].video_info.variants.filter(file => file.content_type == "video/mp4");

            
            media_files.map(file => {
                buttons.push([
                    {
                        text: `🎞 ${file.url.includes("amplify_video")
                            ? file.url.split("/")[6]
                            : file.url.split("/")[7]
                            }`,
                        callback_data: file.url.includes("amplify_video")
                            ? file.url.split("/")[6]
                            : file.url.split("/")[7]
                    }
                ])
            });

            HANDLE_EDIT_MESSAGE('\n\n\n\⬇️ Choose a quality...', {
                chat_id: response.chat.id,
                message_id: response.message_id,
                reply_markup: {
                    inline_keyboard: buttons
                }
            })



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



exports.HANDLE_TWEET_CALLBACK = async (query, Bot, HANDLE_SEND_MESSAGE) => {
    const data = query.data;
    const chatId = query.message.chat.id;
    const qmsgId = query.message.message_id;
    let quality_button = [];
    let button_icon;
    try {

        const quality = media_files.filter(file => file.url.includes(data));

        if (quality.length) {
           
            media_files.map(file => {
                if (file.url.includes('apmplify_video') && file.url.split('/')[6] == data || file.url.split("/")[7] == data) {

                    button_icon = "✅";

                } else {
                    button_icon = "🎞";
                };

                quality_button.push([
                    {
                        text: `${button_icon} Quality ${file.url.includes("amplify_video")
                            ? file.url.split("/")[6]
                            : file.url.split("/")[7]
                            }`,
                        callback_data: file.url.includes("amplify_video")
                            ? file.url.split("/")[6]
                            : file.url.split("/")[7]
                    }
                ]);
            });


            const options = {
                caption: `\n\n - - - \n\n  @DownloadThisVidBot`,
                reply_to_message_id: message_id,
                reply_markup: {
                    inline_keyboard: quality_button
                }
            };



            await Bot.sendVideo(chatId, quality[0].url, options)
            await Bot.deleteMessage(chatId, qmsgId)
        } else {
            await Bot.deleteMessage(chatId, qmsgId)
        }

    } catch (error) {

        HANDLE_SEND_MESSAGE(chatId,'⚠️ Sorry, The quality of this video is not available now, please choose another quality.',{
            reply_to_message_id: message_id,
                reply_markup: {
                    inline_keyboard: quality_button
                }
            })
        console.log(error)
    }

}