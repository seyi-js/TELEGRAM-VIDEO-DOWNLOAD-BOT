//Load ENV variables
require('dotenv').config();

const { CONNECT_TO_DATABASE } = require('./libs/config/DBconfig');
const Telegram = require('./libs/telegram');
const { HANDLE_GET_BOT_MENTIONS } = require('./libs/twitter')






           


// return

CONNECT_TO_DATABASE();

Telegram().INITIATE_BOT()

const HANDLE_SEND_VIDEO = Telegram().HANDLE_SEND_VIDEO

// HANDLE_GET_BOT_MENTIONS(null, HANDLE_SEND_VIDEO);

setInterval(() => {

    HANDLE_GET_BOT_MENTIONS(null, HANDLE_SEND_VIDEO);

}, 1000 * 60 * 4)//Every 4 minutes




