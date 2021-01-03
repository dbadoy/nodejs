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


function myTx() {
  const eos = Eos(eos_config);
  
  eos.transaction({
                actions: [{
                    account: "[ACCOUNT_NAME]",
                    name: "[ACTION_NAME]",
                    data: {
                        //[ACTION_PARAMETER] : [VALUE],
                        //.
                        //.
                        //.
                        // example
                        user: "examaccount1",
                        phonenum: 00000000000,
                    },
                    authorization: [{
                        actor: [ACCOUNT_NAME],
                        permission: "[active / owner ]"
                    }]
                }]
            })
            .catch( err => { 
                console.log("Error (eos.transaction) ! : " + err);
            })
}
