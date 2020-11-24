var key  =  process.env.SERVER_EOSPRIV;
const eos_config = {
    expireInSeconds: 60,
    broadcast: true,
    debug: false,
    sign: true,
    httpEndpoint: 'https://jungle3.cryptolions.io:443',
    keyProvider: [
        key,
    ], // yuseungbae12 's private key
    chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
};  // jungle3 's chainId


const router = require("express").Router();
const {auth} = require("../../util/auth");
let User = require("../../models/user.model");
let Cert = require("../../models/cert.model");
let Retiremnet = require("../../models/retirement.model");
let Tnft = require("../../models/tnft_model");

const crypto = require('crypto');
const eosjs_acc = require("eosjs-ecc");
const { json } = require("body-parser");
const Eos = require('eosjs');
const { encrypt, decrypt } = require("eos-encrypt");
const cryptoRandomString = require('crypto-random-string');

const eos = Eos(eos_config);
const ecc = eosjs_acc;



// use asset --> eos-common
router.post('/issuenft', auth, async(req, res) => {

    const { certifinum, privatekey } = req.body;

    const token = req.headers.authorization.split('Bearer ')[1];
    const decoded = jwt.verify(token, process.env.jwtSecret);
    

    const eos = Eos(eos_config);

    await User.findOne({ userid: decoded.id})
        .then((user) => {
            if(!user){return res.status(400).json("Err : Not exist user")}
            //const encrypted = encrypt(private, public, sessionkey);

            Cert.findOne({certifinum: certifinum})
            .then( certT => {
                if(!certT){ return res.status(400).json("No exist certification !") }

                Retiremnet.findOne({certifinum: certT.certifinum})
                .then( retireT => {
                    if(!retireT){return res.status(400).json("No exist retirement !")}

                    let my_nft = {
                        target : certT.target,
                        company : certT.company,
                        start_date : certT.start_date,
                        contents : certT.contents
                    };
                    let my_nft2 = {
                        end_date : certT.end_date,
                        write_date : certT.write_date,
                        retire_date : retireT.retire_date
                    }

                    
                    const enc_nftData = encrypt(privatekey, user.eos_publickey, JSON.stringify(my_nft));
                    const enc_nftData2 = encrypt(privatekey, user.eos_publickey, JSON.stringify(my_nft2));

                    const enc_total = enc_nftData +'*' + enc_nftData2;
                    let tmp = enc_total.toString('base64');



                    eos.transaction({ // create nft
                        actions: [{
                            account: "alibicontrac",
                            name: "create",
                            data: {
                                author: "alibicontrac",
                                category: "nft",
                                owner: user.eos_accountname,
                                idata : tmp,
                                mdata: "",
                                requireclaim: 0
                            },
                            authorization: [{
                                actor: "alibicontrac",
                                permission: "active"
                            }]
                        }]
                    })
                    .then( tx => { // set hash
                        const idata_hash = ecc.sha256(tmp);
                        eos.getTableRows({
                            code:"alibicontrac",
                            scope: "alibicontrac",
                            table: 'global',
                            json: true,
                        }).then( gResult => {
                            const num = gResult.rows[0].Inftid;
                            eos.transaction({
                                actions: [{
                                    account: "alibicontrac",
                                    name: "setnfthash",
                                    data: {
                                        owner: user.eos_accountname,
                                        nft_id: num,
                                        nft_hash: idata_hash,
                                    },
                                    authorization: [{
                                        actor: user.eos_accountname,
                                        permission: "active"
                                    }]
                                }]
                            }).catch(err => { return res.status(400).json("Err !! : " + err)})
                        }).catch(err => { return res.status(400).json("Err !! : " + err)})
                       

                    })
                    .catch(err => { return res.status(400).json("Err !! : " + err)})
                }).catch((err) => { return res.status(400).json("Err" + err)})
            }).catch((err) => { return res.status(400).json("Err" + err)})
        })
        .catch((err) => { return res.status(400).json("Err" + err)})
});

router.get('/getmynft', auth ,async(req, res) => {
    const { userid, privatekey } = req.body;

    let Arr = new Array();
    let item = new Object();

    User.findOne({userid: userid})
    .then(user => {
        
        eos.getTableRows({
            code:"alibicontrac",
            scope: user.eos_accountname,
            table: 'sassets',
            json: true,
        }).then(result => {
            for(var i = 0; i < result.rows.length; i ++){
                item = result.rows[i];
                Arr.push(item);
            }
            for(var j = 0; j < Arr.length; j ++){
                Arr[j].idata = decrypt(privatekey, user.publickey, Arr[j].idata);
            }
            return res.status(200).json(Arr);
    
        }).catch(err => {
            res.status(400).json("Err : " + err);
        })
    })

})

router.post('/setpermission', auth, async(req, res) => {

    const { userid, targetid ,nftid ,privatekey } = req.body;

    eos.getTableRows({
        code:"alibicontrac",
        scope: user.eos_accountname,
        table: 'sassets',
        json: true,
    })
    .then( result => {
        let flag = 0;
        for(var i = o; i <result.rows.length; i ++){
            if(result.rows[i].id == nftid){}
                flag = i;
        }
        if(flag==0){ return res.status(400).json("No exist nft")}

        User.findOne({ userid: userid})
        .then(user => {
            if(!user){ return res.status(400).json("Not exist user !"); } 

            const temp = decrypt(privatekey, user.publickey, result.rows[flag].idata);
            /*
            check hash value code...
            */

            var tmp = cryptoRandomString({length:5, type: "alphanumeric"});
            

            const cipher = crypto.createCipher('aes-256-cbc', tmp);

            let enc_idata =  cipher.update(JSON.stringify(temp), 'utf8', 'base64');
            enc_idata += cipher.final('base64');



            let newTnft = new Tnft({
                nftid : nftid,
                encnft : enc_idata
            });

            newTnft.save()
                    .catch(err => { return res.status(400).json("Err : " + err)})

            return res.status(200).json({"nftid" : nftid},{"nftpassword : " : tmp}) // 


        }).catch(err => { return res.status(400).json("Err : " + err)})
    }).catch(err => { return res.status(400).json("Err : " + err)})
})
/*
블록체인의 idata를 불러와서 복호화 후, hash 비교.
검증완료시 복호화 데이터를 session키로 암호화해서 DB에 저장.
유저는 그  session key를 상대방한테 공유하여 접근허가
*/
router.get('./getpermission', auth, async(req, res) => {
    const { nftid, sessionkey } = req.body;

    Tnft.findOne({nftid : nftid})
    .then(nft => {
        if(!nft){ return res.status(400).json("Not exist nft !"); }

        const enc_idata = nft.encnft;

        const decipher = crypto.createDecipher('aes-256-cbc', sessionkey);
        var dec_idata = decipher.update(enc_idata, 'base64', 'utf8');
        dec_idata += decipher.final('utf8');

        return res.status(200).json({"nftid": nftid}, {"idata" : dec_idata});
    })

})


router.get('/tmp', async (req,res) => {
    var a = {"name" : "hi", "age" : 17}
    console.log(a);
    var tmp = JSON.stringify(a);
    console.log(tmp);
    var output = ecc.sha256(tmp)
    console.log(output);

    var tmp2 = JSON.parse(tmp);
    console.log(tmp2);
})
router.get('/tmp2', async (Req, res) => {
        var decrypted = "dsifwjelkwfqjlk";

       /* var tmp="";
        for(var i = 0; i<=5; i ++){
            tmp = tmp + (await randomNumber(0,9)).toString();
        }*/
        var tmp = "19203";

        const cipher = crypto.createCipher('aes-256-cbc', tmp);
        var enc_session =  cipher.update(decrypted, 'utf8', 'base64');
        enc_session += cipher.final('base64');
        console.log(enc_session);

        const decipher = crypto.createDecipher('aes-256-cbc', tmp);
        var dec_session = decipher.update(enc_session, 'base64', 'utf8');
        dec_session += decipher.final('utf8');
        console.log(dec_session);
})


module.exports = router;
