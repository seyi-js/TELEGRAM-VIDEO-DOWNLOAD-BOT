//Load ENV variables
require('dotenv').config();

const {CONNECT_TO_DATABASE} = require('./libs/config/DBconfig');
const polling = require('./libs/telegram');


CONNECT_TO_DATABASE();







