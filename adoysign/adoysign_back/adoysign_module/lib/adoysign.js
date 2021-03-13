exports.module_name = 'adoysign.js';

const cryptoRandomString = require('crypto-random-string');
const sha256 = require('sha256');


exports.gen = function(len) {
    const rand = cryptoRandomString({length:len, type: "ascii-printable"});
    return rand;
}

exports.eosSet = function(key){
    return new Promise(function(resolve, reject) {
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
        };   
        resolve(eos_config);
    })
}

exports.setCreateAction = function(eos, account, signcode){
    return new Promise(function(resolve, reject){
        if(eos.length) { reject("incorrect eos function")}
        eos.getAccount(account).then(res => {}).catch(err=>{ reject("Not exist eos account")});

        const entered_signCode_hash = sha256(signcode);

        const actions= [{
            account: "adoycontract",
            name: "sethash",
            data: {
                user : account,
                signhash: entered_signCode_hash
            },
            authorization: [{
                actor: account,
                permission: "active"
            }
        
        ]
        }]

        resolve(actions);
    });
}

exports.getSignnum = function(eos, signcode){
    return new Promise(function(resolve, reject){
        const signhash = sha256(signcode);

        eos.getTableRows({
            code:"adoycontract",
            scope:"adoycontract",
            table: 'signs', 
            limit: 9999,
            json: true,
        })
        .then( res => {
            let index = 0;
            let flag = 0;
            for(let i = 0; i < res.rows.length; i ++){
                if( res.rows[i].signhashvalue == signhash){
                    index = i;
                }else{ flag -= 1;}
            }
            if( flag == -(res.rows.length)){ reject("Not exist sign number") }
            else{resolve(res.rows[index].signnum)}
        }).catch(err =>{ reject(err)})
    }) 
}

exports.compare = function( eos, signnum, signcode){
    return new Promise(function(resolve, reject){
        if(eos.length) { reject("incorrect eos function")}

        if( signnum == null || signcode == null) {
           reject("input correct parameter");
        }

        eos.getTableRows({
            code:"adoycontract",
            scope:"adoycontract",
            table: 'signs',
            lower_bound: signnum,     // Table primary key value
            json: true,
        })
        .then( res => {

            if(!res.rows[0]) { reject("Not exist sign number")}
            const hash_inChain = res.rows[0].signhashvalue;
            const hash_input = sha256(signcode);

            if(hash_input == hash_inChain){ resolve(true); }
            else{ resolve(false); }
        })
        .catch( err => { 
            reject("eos get table error : " + err);
        })
    });

}