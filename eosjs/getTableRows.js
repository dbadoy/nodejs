// npm install eosjs@16.0.9

const Eos = require('eosjs');

// set eos config
const eos_config = {
    expireInSeconds: 60,
    broadcast: true,
    debug: false,
    sign: true,
    httpEndpoint: 'https://jungle3.cryptolions.io:443',
    keyProvider: [
        key
    ], 
    chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
};  // Jungle3's chainId


function getTableRows(){

      const eos = Eos(eos_config);

      eos.getTableRows({
                          code:"[ACCOUNT_NAME]",
                          scope:"[ACCOUNT_NAME]",
                          table: '[TABLE_NAME]',
                          json: true,
                      })
                      .then( result =>{
                          if(!result.rows[0]){ console.log("Non-exist data in table"); }
                          else{ console.log(result.rows); }
                      }).catch(err=>{ console.log("Error (eos.getTableRows) ! : " + err) })
                      
}
