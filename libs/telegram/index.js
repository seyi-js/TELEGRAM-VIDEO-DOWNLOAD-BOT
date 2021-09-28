"use strict";
const Telegram = require('node-telegram-bot-api');
const { HANDLE_VERIFY_URL, GENERATE_OTP } = require('../../misc');
const { User } = require('../model');
const { GET_TWEET_DETAILS, HANDLE_TWEET_CALLBACK, LOOK_UP_USER_BY_SCREEN_NAME, HANDLE_SEND_DIRECT_MESSAGE } = require('../twitter');
const { screen_name, VERIFICATION_ATTEMPT } = require('../../misc/utils')
let apiKey;
if (process.env.NODE_ENV !== 'production') {
    apiKey = require('../config').telegram_envs.api_key
} else {
    apiKey = process.env.telegram_api_key;
};


const Bot = new Telegram(apiKey, { polling: true });











module.exports = () => {

    const INITIATE_BOT = () => {

        Bot.on('text', (message) => {
            HANDLE_RESPOND_TO_MESSAGE(message)
        });


    };

    const HANDLE_RESPOND_TO_MESSAGE = async (message) => {

        const user = await User.findOne({ telegram_user_id: message.from.id });

        if (user && user.isBlocked) {
            return HANDLE_SEND_MESSAGE(message.chat.id, `You are currently restricted from using this Bot. Kindly reach out the admin.`, { reply_to_message_id: message.message_id });
        };
        let match = message.text.substring(0, 5);
        let register = message.text.replaceAll(' ', '').split('-')[0]

        //For URLs
        if (match === 'https') {
            return HANDLE_URLS(message)
        };

        //For socials registration
        // console.log(register.slice(0,7))
        if (register.slice(0, 7).toUpperCase() === 'TWITTER') {
            return MANAGE_REGISTRATION(message)
        };


        let message_to_send;
        switch (message.text) {
            case 'start':
            case '/start':



                if (user) {

                    message_to_send = `
                    Hi @${message.from.first_name || message.from.username},\n\nIt really feels nice to have you back.`;

                } else {
                    message_to_send = `
                    Hi @${message.from.first_name || message.from.username},\n\nI'm a Video Downloader bot, send me a video URL or you can tag me on twitter and i will send the video right here.\n\nI currently support twitter video download, more to come in the future.\n\nMade with ❤️ in Nigeria 🇳🇬 by @SEYIJS`;

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
                Hi @${message.from.first_name || message.from.username},\n\nI'm a Video Downloader bot, send me a video URL or you can tag me on twitter and i will send the video right here.\n\nI currently support twitter video download, more to come in the future.\n\nMade with ❤️ in Nigeria 🇳🇬 by @SEYIJS`;

                return HANDLE_SEND_MESSAGE(message.chat.id, message_to_send, { reply_to_message_id: message.message_id });

            case '/link':
            case 'link':
                message_to_send = `You can link your telegram account to your twitter account by sending your Twitter screen name in this format TWITTER - YOUR_SCREEN_NAME then follow the prompts.`

                return HANDLE_SEND_MESSAGE(message.chat.id, message_to_send, { reply_to_message_id: message.message_id });

            default:
                return HANDLE_SEND_MESSAGE(message.chat.id, `Hi @${message.from.first_name || message.from.username},\n\nI do not understand the command you entered.`, { reply_to_message_id: message.message_id });
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


    const HANDLE_EDIT_MESSAGE = (text, options) => {
        try {

            Bot.editMessageText(text, options)

        } catch (error) {
            console.log(error)
        };
    };

    /**
     * @param {Object} message 
     */
    const HANDLE_URLS = async (message) => {
        const match = HANDLE_VERIFY_URL(message.text);

        if (match) {
            switch (match.origin) {
                case 'https://twitter.com':
                    const response = await HANDLE_SEND_MESSAGE(message.chat.id, 'Generating your video... ⏳'.italics(), { reply_to_message_id: message.message_id, parse_mode: 'html' })
                    GET_TWEET_DETAILS(message, HANDLE_SEND_MESSAGE, HANDLE_EDIT_MESSAGE, response, HANDLE_SEND_VIDEO)

                    break;

                default:
                    return HANDLE_SEND_MESSAGE(message.chat.id, `Hi @${message.from.first_name || message.from.username},\nYou have entered an invalid or unsupported URL.`, { reply_to_message_id: message.message_id })
            }
        } else {
            return HANDLE_SEND_MESSAGE(message.chat.id, `Hi @${message.from.first_name || message.from.username},\nYou have entered an invalid or unsupported URL.`, { reply_to_message_id: message.message_id })
        }
    };


    const HANDLE_SEND_VIDEO = async (chatId, url, options) => {

        try {

            await Bot.sendVideo(chatId, url, options);

        } catch (error) {
            console.log(error)
        };
    };



    const MANAGE_REGISTRATION = async (message) => {
        try {
            const social = message.text.replaceAll(' ', '').split('-');
            /**
             * social[0] contains the description
             * social[1] containt the valu
             */
            const OTP = GENERATE_OTP();
            switch (social[0].toUpperCase()) {
                case 'TWITTER':

                    if (!social[1]) {
                        return await HANDLE_SEND_MESSAGE(message.chat.id, ` Kindly check if the info was entered in the correct order.\ne.g TWITTER - YOUR_SCREEN_NAME`, { reply_to_message_id: message.message_id, parse_mode: 'html' })
                    }
                    const user = await LOOK_UP_USER_BY_SCREEN_NAME(social[1]);



                    await HANDLE_SEND_MESSAGE(message.chat.id, 'Linking in progress... ⏳'.italics(), { reply_to_message_id: message.message_id, parse_mode: 'html' })

                    if (!user) {
                        return HANDLE_SEND_MESSAGE(message.chat.id, `The user with this screen name @${social[1]} could not be found. Kindly check if the screen name was entered in the correct order.`, { reply_to_message_id: message.message_id });
                    };

                    const DBuser = await User.findOne({ telegram_user_id: message.from.id });

                    if (!DBuser) {
                        return HANDLE_SEND_MESSAGE(message.chat.id, `Kindly restart this Bot by clearing the application history.`, { reply_to_message_id: message.message_id });
                    };

                    if (DBuser.twitter_info.info_verified) {
                        return HANDLE_SEND_MESSAGE(message.chat.id, `Your info has been registered already.`, { reply_to_message_id: message.message_id });
                    };

                    DBuser.twitter_info = {
                        user_id: user.id_str,
                        screen_name: user.screen_name,
                        otp: OTP,
                        info_verified: false
                    };

                    await DBuser.save();

                    const twitter_message = `Hello @${user.screen_name}, a telegram user has requested to link your twitter account with their @${screen_name} account.\n\nHere's the OTP requested by the application ${OTP}\n\nKindly disregard this message if you did'nt authorize the process.`
                    await HANDLE_SEND_DIRECT_MESSAGE(user.id_str, twitter_message);

                    return HANDLE_SEND_MESSAGE(message.chat.id, `An OTP has been sent to your Twitter inbox. Kindly copy it and enter it in this format.\n\n TWITTEROTP - YOUR OTP\n  e.g\nTWITTEROTP - 123456`, { reply_to_message_id: message.message_id });


                case 'TWITTEROTP':
                    if (!social[1]) {
                        return await HANDLE_SEND_MESSAGE(message.chat.id, ` Kindly check if the info was entered in the correct order.\ne.g TWITTEROTP - YOUR_OTP`, { reply_to_message_id: message.message_id, parse_mode: 'html' })
                    }
                    const opt_user = await User.findOne({ telegram_user_id: message.from.id });

                    await HANDLE_SEND_MESSAGE(message.chat.id, 'Verification in progress... ⏳'.italics(), { reply_to_message_id: message.message_id, parse_mode: 'html' })

                    if (!opt_user) {
                        return HANDLE_SEND_MESSAGE(message.chat.id, `Kindly restart this Bot by clearing the chat history.`, { reply_to_message_id: message.message_id });
                    }

                    if (opt_user.twitter_info.info_verified) {
                        return HANDLE_SEND_MESSAGE(message.chat.id, `Your info has been registered already.`, { reply_to_message_id: message.message_id });
                    };


                    if (parseInt(opt_user.twitter_info.otp) !== parseInt(social[1])) {
                        opt_user.twitter_info.verification_attempt = opt_user.twitter_info.verification_attempt + 1;
                        opt_user.twitter_info.verification_attempt === VERIFICATION_ATTEMPT ? opt_user.isBlocked = true : null;
                        await opt_user.save();
                        return HANDLE_SEND_MESSAGE(message.chat.id, `You have entered an incorrect OTP. You have ${parseInt(VERIFICATION_ATTEMPT) - parseInt(opt_user.twitter_info.verification_attempt)} attempts left.`, { reply_to_message_id: message.message_id });

                    };

                    opt_user.twitter_info.verification_attempt = 0;
                    opt_user.twitter_info.info_verified = true;
                    await opt_user.save();

                    return HANDLE_SEND_MESSAGE(message.chat.id, `Hurray!!!, your twitter account has been linked successfully. You can now mention me under any tweet containing a video and I will send it right into your telegram inbox.`, { reply_to_message_id: message.message_id });






                default:
                    return HANDLE_SEND_MESSAGE(message.chat.id, ` Kindly check if the info was entered in the correct order.`, { reply_to_message_id: message.message_id });
            }
        } catch (error) {
            console.log(error)
            return HANDLE_SEND_MESSAGE(message.chat.id, `Hi @${message.from.first_name || message.from.username},\nYour twitter account cannot be linked at this moment. Please try again later.`, { reply_to_message_id: message.message_id });

        }
    };

    return {
        INITIATE_BOT,
        MANAGE_REGISTRATION,
        HANDLE_RESPOND_TO_MESSAGE,
        HANDLE_SEND_MESSAGE,
        HANDLE_SEND_VIDEO,
        HANDLE_EDIT_MESSAGE
    }

}




