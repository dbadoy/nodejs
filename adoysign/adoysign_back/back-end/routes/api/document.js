const router = require("express").Router();

const adoydoc = require("../../../adoysign_module/lib/adoydoc");
const adoysign = require("../../../adoysign_module/lib/adoysign");

let Doc = require("../../models/doc.models");

const { auth } = require("../../util/auth");
const sha256 = require('sha256');
const Eos = require('eosjs');
const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('http://localhost:5001');

//done
router.post('/setdoc', async(req, res) => {
    const { eos_account, privatekey, document, title } = req.body;
    //ipfs.setProvider(require('ipfs-api')('localhost', '5001'))
    const myDoc = document.split(',')[1];



    const mydata = new Buffer.from(myDoc, 'base64');
    const cid = await ipfs.add(mydata);
    const cid_hash = sha256(cid.path);


    adoysign.eosSet(privatekey)
    .then( eos_config =>{
        const eos = Eos(eos_config);

        adoydoc.setDocAction(eos, eos_account, cid_hash)
        .then( myAction => {
            eos.transaction({actions: myAction})
            .then( result => {
                adoydoc.getDocnum(eos, cid_hash)
                .then( docnum =>{
                    let temp = new Doc({
                        user: eos_account,
                        title,
                        docnum: docnum,
                        doc: cid.path
                    });
                    temp.save()
                        .then(r => { 
                            //ipfs.stop().catch(e=>{console.log(e)})
                            return res.status(200).json({"docnum" : docnum, "cid" : cid.path})
                        })
                        .catch(err => { return res.status(400).json("Error in mongo" +err)})  
                        
                }).catch( err => { return res.status(400).json("Error in getDocnum" +err)})

            }).catch( err => { return res.status(400).json("Error in transaction" + err)})
        }).catch( err => { return res.status(400).json("Error in setDocAction" +err)})
    }).catch( err => { return res.status(400).json("Error in eos set" +err)})
})

//eos, account, signnum, signcode, docnum ,dochash
router.post('/signdoc', auth ,async(req, res) =>{
    const { eos_account, signnum, signcode, docnum, dochash, privatekey } = req.body;
    adoysign.eosSet(privatekey)
    .then( eos_config => {
        const eos = Eos(eos_config);

        adoydoc.setSignAction(eos, eos_account,signnum,signcode, docnum, dochash)
        .then( myAction => {
            eos.transaction({actions: myAction})
            .then( result =>{
                return res.status(200).json("Sign success !");
            }).catch( err => { return res.status(400).json("Error in transaction : " + err)})
        }).catch( err => { return res.status(400).json("Error in setSignAction: " + err)})
    }).catch( err => { return res.status(400).json("Error in eos set : " + err)})
})

router.post('/getsigner', async(req, res) => {
    const { eos_account, docnum } =  req.body;

    adoysign.eosSet("")
    .then( eos_config => {
        const eos = Eos(eos_config);

        adoydoc.getSigner(eos, docnum)
        .then( result =>{
            return res.status(200).json(result);
        }).catch( err =>{ return res.status(400).json("Not exist ...") })
    })
})

router.post('/getdoclist', auth, async(req, res) =>{
    const { eos_account } = req.body;

    Doc.find({user : eos_account})
    .select("-_id")
    .then( result => {
        if(!result){ return res.status(201).json("NULL"); }
        let myListArr = new Array();
        for( let i = 0; i < result.length; i++){
            if( result[i].user == eos_account){
                myListArr.push(result[i]);
            }
        }

        return res.status(200).json(myListArr);
    })


})

router.post('/checkdoc', auth, async(req, res) => {
    const { docnum, doc } = req.body;

    Doc.findOne({docnum : docnum})
    .then( result => {
        if(!result) {return res.status(201).json("Not exist document");}

        adoysign.eosSet("")
            .then( eos_config => {
                 const eos = Eos(eos_config);

                 eos.getTableRows({
                    code:"adoycontract",
                    scope:"adoycontract",
                    table: 'doc', 
                    lower_bound: docnum,  
                    json: true,
                })
                .then( result => {
                    if(!result.rows[0]) { return res.status(201).json("Not exist document"); }
                    if(result.rows[0].originhash == sha256(doc)){
                        return res.status(200).json({inBlock: result.rows[0].originhash, result: true});
                    }
                    else{
                        return res.status(201).json({inBlock: result.rows[0].originhash, result: false});    
                    }

                }).catch(err => { res.status(400).json("Err in getTableRows : " + err)})
            }).catch(err => { res.status(400).json("Err in eosSet : " + err)})
        }).catch(err => { res.status(400).json("Err in findOne_Doc : " + err)})
})



/*router.post('/setdoc', async(req, res) =>{
    const { eos_account, doc_hash, privatekey } = req.body;
    
    adoysign.eosSet(privatekey)
    .then( eos_config =>{
        const eos = Eos(eos_config);

        adoydoc.setDocAction(eos, eos_account, doc_hash)
        .then( myAction => {
            eos.transaction({actions: myAction})
            .then( result => {
                adoydoc.getDocnum(eos, doc_hash)
                .then( docnum =>{
                    return res.status(200).json({"docnum" : docnum})
                }).catch( err => { return res.status(400).json("Error in getDocnum")})

            }).catch( err => { return res.status(400).json("Error in transaction")})
        }).catch( err => { return res.status(400).json("Error in setDocAction")})
    }).catch( err => { return res.status(400).json("Error in eos set")})
})*/

module.exports = router;