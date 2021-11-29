const {User,Media,TwitterUser} = require('../../model')
const {HANDLE_WRITE_RESPONSE_TO_FILE} =require('../../../misc')
const {screen_name} = require('../../../misc/utils');
const Twitter = require('../auth').AUTH()
module.exports = () => {
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

            const {
                data
            } = await Twitter.get('statuses/user_timeline', options);

            return data;
        } catch (error) {
            console.log(error)
            console.log('FROM HANDLE BOT TIMELINE', error.allErrors[0].message)




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
            const {
                data
            } = await Twitter.get('statuses/lookup', options);
            // console.log(data)
            return data;
        } catch (error) {

            console.log('FROM HANDLE REF TWEET', error)

        }
    };


    const PROCESS_REQUEST = async(screen_name,url,HANDLE_SEND_VIDEO)=>{
        try {

            const options = {
                caption: `Hi @${screen_name}, here's the video you requested from Twitter.\n\n - - - \n\n `
            };

            //Check if the user is in the DB
            const user = await User.findOne({
                'twitter_info.screen_name': screen_name
            });
            
            if (user && user.twitter_info.info_verified) {

                let chatId = user.telegram_user_id; //Get user info from DB.
                await HANDLE_SEND_VIDEO(chatId, url, options);
            };

            return;
        } catch (error) {
            throw error;
        }
    };

    /**
     * 
     * @param {Array} tweets 
     * @param {Function} HANDLE_SEND_VIDEO 
     */
    const HANDLE_EXTRACT_VIDEO_FROM_TWEET = async (tweets, HANDLE_SEND_VIDEO, mentions) => {
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


                    const listedIDS = ['1452471923242201095']

                    if (listedIDS.find(id => id.includes(referenced_tweet.id_str) || referenced_tweet.id_str.includes(id))) {
                        return;
                    }


                    const media_files = referenced_tweet.extended_entities.media[0].video_info.variants.filter(file => file.content_type == "video/mp4");
                    // const sorted = files.sort((a,b)=> b.bitrate - a.bitrate)
                    const greatest_bitrate = media_files.sort((fileA, fileB) => fileB.bitrate - fileA.bitrate)[0]

                    const options = {
                        caption: `Hi @${the_mention.user.screen_name}, here's the video you requested from Twitter.\n\n - - - \n\n  @${screen_name}`
                    };
                    //Check if the user is in the DB
                    const user = await User.findOne({
                        'twitter_info.user_id': the_mention.user.id_str
                    });

                    return console.log(referenced_tweet)

                    // console.log(user)
                    if (user && user.twitter_info.info_verified) {


                        // console.log(the_mention.id_str)
                        // return 

                        let chatId = user.telegram_user_id; //Get user info from DB.
                        await HANDLE_SEND_VIDEO(chatId, greatest_bitrate.url, options);

                        // console.log(media_files)
                        return await HANDLE_REPLY_A_TWEET(the_mention.id_str, `Hello @${the_mention.user.screen_name},\nThis Video has been sent to your telegram account.`)


                    };
                    if (user && !user.twitter_info.info_verified) {
                        HANDLE_REPLY_A_TWEET(the_mention.id_str, `Hello @${the_mention.user.screen_name},\nKindly verify your account.`);
                    }

                    if (!user) {
                        HANDLE_REPLY_A_TWEET(the_mention.id_str, `Hello @${the_mention.user.screen_name},\nIt looks like you haven't linked your telegram account with your twitter account, kindly click on the link in my bio to get started.`);
                    };

                    // console.log('User Not Found for this tweet',the_mention.user)


                });
            };


        } catch (error) {

            HANDLE_REPLY_A_TWEET(the_mention.id_str, `Hello @${the_mention.user.screen_name},\nFor some reasons i cannot access this tweet.`);
            console.log('FROM EXTRACT VID FROM TWEET', error.response);

        };
    };

    /**
     * 
     * @param {String} tweet_id 
     * @param {String} message 
     */
    const HANDLE_REPLY_A_TWEET = async (tweet_id, message) => {
        try {

            const options = {
                in_reply_to_status_id: tweet_id,
                auto_populate_reply_metadata: true,
                status: message
            }

            await Twitter.post('statuses/update', options)

        } catch (error) {
            console.log(error)
        }
    };


    /**
     * 
     * @param {String} user_id 
     * @param {String} message 
     */
    const HANDLE_SEND_DIRECT_MESSAGE = async (user_id, message) => {
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
    const LOOK_UP_USER_BY_SCREEN_NAME = async (screen_name) => {
        try {
            const {
                data
            } = await Twitter.get('users/lookup', {
                screen_name
            });
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
 * @description checks if the tweet has been processed before
 * @param {id} id 
 */
const IS_PROCESSED = async(id) =>{
    try {
        const tweet = await Media.findOne({tweet_id:id});

        if(!tweet){
            return false
        }else{
            return true
        }
    } catch (error) {

        throw new Error(error)
    };
};


    return {
        HANDLE_VALIDATE_MENTION,
        HANDLE_GET_BOT_TIMELINE,
        HANDLE_GET_REFERENCED_TWEET,
        HANDLE_EXTRACT_VIDEO_FROM_TWEET,
        HANDLE_REPLY_A_TWEET,
        HANDLE_SEND_DIRECT_MESSAGE,
        LOOK_UP_USER_BY_SCREEN_NAME,
        IS_PROCESSED,
        PROCESS_REQUEST
    }
}