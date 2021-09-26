const mongoose = require('mongoose');
mongoose.set('autoIndex', true);

let db;

(process.env.NODE_ENV !== 'production') ? db = 'mongodb://localhost:27017/downloadBot' : db = process.env.TELEGRAM_DOWNLOAD_BOT_URL;



exports.CONNECT_TO_DATABASE = async () => {
    try {

        await mongoose.connect(db, { useUnifiedTopology: true, useNewUrlParser: true });

        console.log('Connected to TELEGRAM DOWNLOAD BOT Database')

    } catch (error) {
        console.log(`Database Connection Error: ${error}`)
    };
}
