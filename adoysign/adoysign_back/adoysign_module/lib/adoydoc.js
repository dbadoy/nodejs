exports.module_name = 'adoydoc.js';


exports.setDocAction = function(eos, account, doc_hash){
    return new Promise(function(resolve, reject){
        
        if(eos.length) { reject("incorrect eos function")}
        eos.getAccount(account).then(res => {}).catch(err=>{reject("Not exist eos account")});

        const actions= [{
            account: "adoycontract",
            name: "setdoc",
            data: {
                user : account,
                originhash: doc_hash
            },
            authorization: [{
                actor: account,
                permission: "active"
            }]
        }]

        resolve(actions);
    })
}

exports.getDocnum = function(eos, dochash){
    return new Promise(function(resolve, reject){
        eos.getTableRows({
            code:"adoycontract",
            scope:"adoycontract",
            table: 'doc', 
            limit: 9999,
            json: true,
        })
        .then( res => {
            let index = 0;
            for(let i = 0; i < res.rows.length; i ++){
                if( res.rows[i].originhash == dochash){
                    index = i;
                }
            }
            if( index == 0 ){ reject("Not exist document number") }
    
            resolve(res.rows[index].docnum)
        }).catch(err =>{ reject(err)})
    }) 
}

exports.getSigner = function(eos, docnum){
    return new Promise(function(resolve, reject){
        eos.getTableRows({
            code:"adoycontract",
            scope:"adoycontract",
            table:"doc",
            lower_bound: docnum,
            json: true,
        })
        .then(result =>{
            if(!result.rows[0]) { reject("No exist document");}
            let mydata = {
                docnum : result.rows[0].docnum,
                signer : result.rows[0].signs
            }

            resolve(mydata);
        }).catch(err =>{ reject(err)})

    })
}


exports.setSignAction = function(eos, account, signnum, signcode, docnum ,dochash){
    return new Promise(function(resolve, reject){
        if(eos.length) { reject("incorrect eos function")}
        eos.getAccount(account).then(res => {}).catch(err=>{reject("Not exist eos account")});
    
        eos.getTableRows({
            code:"adoycontract",
            scope:"adoycontract",
            table: 'doc',
            lower_bound: docnum,     // Table primary key value
            json: true,
        })
        .then(result => {
            if(!result.rows[0]) { reject("No exist docnum")}
            if(result.rows[0].originhash != dochash) { reject("Wrong document.")}
    
    
            const actions= [{
                account: "adoycontract",
                name: "signdoc",
                data: {
                    user : account,
                    sign_num : signnum,
                    sign_code: signcode,
                    doc_num : docnum,
                    my_doc_hash : dochash
                },
                authorization: [{
                    actor: account,
                    permission: "active"
                }]
            }]  // find signhash -> user -> change value true .
    
            resolve(actions);
        }).catch(err =>{ reject(err)})
    })

}

//return docnum