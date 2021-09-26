const Telegram = require('node-telegram-bot-api');
const { HANDLE_VERIFY_URL } = require('../../misc');
const { User } = require('../model');
const {GET_TWEET_DETAILS,HANDLE_TWEET_CALLBACK} = require('../twitter')
let apiKey;
if (process.env.NODE_ENV !== 'production') {
    apiKey = require('../config').telegram_envs.api_key
} else {
    apiKey = process.env.telegram_api_key;
};


const Bot = new Telegram(apiKey, { polling: true });


/**
 * @description example of a text message
 * {
  message_id: 1,
  from: {
    id: 954904207,
    is_bot: false,
    first_name: 'SEYIJS',
    username: 'SEYIJS',
    language_code: 'en'
  },
  chat: {
    id: 954904207,
    first_name: 'SEYIJS',
    username: 'SEYIJS',
    type: 'private'
  },
  date: 1632625102,
  text: '/start',
  entities: [ { offset: 0, length: 6, type: 'bot_command' } ]
}

 */



Bot.on('text', (message) => {
    HANDLE_RESPOND_TO_MESSAGE(message)
});

Bot.on('callback_query', (query) =>{
    HANDLE_TWEET_CALLBACK(query,Bot,HANDLE_SEND_MESSAGE)
    // console.log(query.data)

    return
  
});


const HANDLE_RESPOND_TO_MESSAGE = async (message) => {

    let match = message.text.substring(0, 5);

    if (match === 'https') {
        return HANDLE_URLS(message)
    };


    let message_to_send;
    switch (message.text) {
        case 'start':
        case '/start':

            const user = await User.findOne({ telegram_user_id: message.from.id })

            if (user) {

                message_to_send = `
                Hi @${message.from.first_name || message.from.username},\n\nIt really feels nice to have you back.`;

            } else {
                message_to_send = `
                Hi @${message.from.first_name || message.from.username},\n\nI'm a Video Downloader bot, send me a video URL  and I'll send you the download link.\n\nI currently support twitter video download, more to come in the future.\n\nMade with ❤️ in Nigeria 🇳🇬 by @SEYIJS`;

                const newUser = new User({
                    telegram_username: message.from.username,
                    telegram_user_id: message.from.id
                });

                await newUser.save();

            }
            return HANDLE_SEND_MESSAGE(message.chat.id, message_to_send, { reply_to_message_id: message.message_id });

        case '/info':
        case 'info':
            message_to_send = `
            Hi @${message.from.first_name || message.from.username},\n\nI'm a Video Downloader bot, send me a video URL  and I'll send you the download link.\n\nI currently support twitter video download, more to come in the future.\n\nMade with ❤️ in Nigeria 🇳🇬 by @SEYIJS`;

            return HANDLE_SEND_MESSAGE(message.chat.id, message_to_send, { reply_to_message_id: message.message_id });

        default:
            return HANDLE_SEND_MESSAGE(message.chat.id, `Hi @${message.from.first_name || message.from.username},\n\nI do not understand the command you entered.`, { reply_to_message_id: message.message_id })
    }
};

//when trying to download a twitter vid, reply first with "Chill while your download link is been generated."

/**
 * 
 * @param {number} chat_id 
 * @param {string} text 
 * @param {object} options 
 */

const HANDLE_SEND_MESSAGE = async (chat_id, text, options) => {
    let response = await Bot.sendMessage(chat_id, text, options);

    return response;
};


const HANDLE_EDIT_MESSAGE = (text,options)=>{
    try {

        Bot.editMessageText(text,options)
        
    } catch (error) {
        console.log(error)
    };
};

/**
 * @param {Object} message 
 */
let media_files=[];
const HANDLE_URLS = async (message) => {
    const match = HANDLE_VERIFY_URL(message.text);

    if (match) {
        switch (match.origin) {
            case 'https://twitter.com':
              const response = await  HANDLE_SEND_MESSAGE(message.chat.id, 'Generating your download link ⏳'.italics(), { reply_to_message_id: message.message_id, parse_mode: 'html' })
              GET_TWEET_DETAILS(message,HANDLE_SEND_MESSAGE,HANDLE_EDIT_MESSAGE,response)

                break;

            default:
                return HANDLE_SEND_MESSAGE(message.chat.id, `Hi @${message.from.first_name || message.from.username},\nYou have entered an invalid or unsupported URL.`, { reply_to_message_id: message.message_id })
        }
    } else {
        return HANDLE_SEND_MESSAGE(message.chat.id, `Hi @${message.from.first_name || message.from.username},\nYou have entered an invalid or unsupported URL.`, { reply_to_message_id: message.message_id })
    }
};








