//Load ENV variables
require('dotenv').config();

const {CONNECT_TO_DATABASE} = require('./libs/config/DBconfig');
const {HANDLE_SEND_VIDEO} = require('./libs/telegram');
const {HANDLE_GET_BOT_MENTIONS} = require('./libs/twitter')

CONNECT_TO_DATABASE();


// HANDLE_GET_BOT_MENTIONS(HANDLE_SEND_VIDEO);






