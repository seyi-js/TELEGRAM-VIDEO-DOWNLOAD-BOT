const Twit = require('twit');
module.exports = {
    AUTH() {
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

        return new Twit(config);
    }

}