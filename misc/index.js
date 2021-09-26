const { URL,parse } = require('url');


/**
 * 
 * @param {String} url 
 * @param {Array} protocols 
 * @returns {Object} match
 */

exports.HANDLE_VERIFY_URL = (url, protocols = ['https']) => {
    try {
        let match = new URL(url);
        
        if (protocols && match.protocol) {
            let prot = protocols.map(x => `${x.toLowerCase()}:`).includes(match.protocol);

            if (prot) {
                return match
            } else {
                return false
            }
        }
    } catch (err) {
        return false;
    }
};

