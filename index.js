//Load ENV variables
require('dotenv').config();

require('./libs/config/DBconfig').CONNECT_TO_DATABASE();
const Telegram = require('./libs/telegram');
const {PROCESS_REQUEST} = require('./libs/twitter/utils/index')()
const express = require('express');
const app = express()
const PORT = process.env.PORT || 40301;
const cors = require( 'cors' );

process.env.NODE_ENV == 'production' ? Telegram().INITIATE_BOT() : null


var whitelist = ['https://sendmethisvid.herokuapp.com'];

var corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1 /*|| !origin*/) {
        callback(null, true)
      } else {
        // callback(new Error('Not allowed by CORS'))
      }
    }
  };
  
app.use( cors() );
//process.env.NODE_ENV == 'production' ? app.use( cors(corsOptions) ) : app.use( cors() );


app.use(express.json({urlenncoded:true}));

app.get('*', (req,res)=>{
    res.status(200).json({message:'ok..'});
});

app.post('/send', async(req,res)=>{
    try {
        const {screen_name,url} = req.body


        if(!screen_name || !url) return res.status(400).json('error')

        await PROCESS_REQUEST(screen_name,url,Telegram().HANDLE_SEND_VIDEO)

        return res.status(200)
    } catch (error) {

        
        console.log(error)

        res.status(200)
    }
});

app.listen( PORT, () => console.log( `Server started on Port ${ PORT }` ) );

// const HANDLE_SEND_VIDEO = Telegram().HANDLE_SEND_VIDEO

// HANDLE_GET_BOT_MENTIONS(null, HANDLE_SEND_VIDEO)
// setInterval(() => {

//     process.env.NODE_ENV == 'production' ? HANDLE_GET_BOT_MENTIONS(null, HANDLE_SEND_VIDEO)  : null

// }, 1000 * 60 * 4)//Every 4 minutes




