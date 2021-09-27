const { URL,parse } = require('url');
const fs = require('fs')

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

exports.HANDLE_WRITE_RESPONSE_TO_FILE = (  fileName, data  ) => {
    const json = JSON.stringify( data, null, 2 )
    fs.appendFile( fileName, `${ json },\n`, ( err ) => {
        if ( err ) {
            console.log( err )
        } else {
            console.log( 'Logged' )
        }

    } );
};


exports.GENERATE_OTP =()=>{
    let pass =''
    const str = '1928374655647382910';

    for ( let i = 0; i <= 5; i++ ) {
        var char = Math.floor( Math.random()
            * str.length );
      
        pass += str.charAt( char )
    }
  
    return pass;


}