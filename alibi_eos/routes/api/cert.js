var account =  process.env.SERVER_EOSACCOUNT;
var key  =  process.env.SERVER_EOSPRIV;
var eos_config = {
    expireInSeconds: 60,
    broadcast: true,
    debug: false,
    sign: true,
    httpEndpoint: 'https://jungle3.cryptolions.io:443',
    keyProvider: [
        key
    ], // yuseungbae12 's private key
    chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
};  // jungle3 's chainId

const router = require("express").Router();
const {auth, getPRIV, Business_number_inspection} = require("../../util/auth");
let User = require("../../models/user.model");
let Cert = require("../../models/cert.model");
let Global = require("../../models/global");
let Retiremnet = require("../../models/retirement.model");

const eosjs_acc = require("eosjs-ecc");
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Eos = require('eosjs');
const { async } = require("crypto-random-string");
const { CertificateList } = require("twilio/lib/rest/preview/deployed_devices/fleet/certificate");

const ecc = eosjs_acc;

// action -> table name, action, account name -> define

router.post("/tmp", [auth, getPRIV], async(req, res) => {
    const token = req.headers.authorization.split('Bearer ')[1];
    const decoded = jwt.verify(token, process.env.jwtSecret);
    

    console.log(req.body.key);
    if(!req.body.password){
        return res.status(400).json("Err : " + "Not entered password")
    }
    await User.findOne({ userid: decoded.id })
    .then((user) =>{
        if(!user){return res.status(400).json("Err : " + err)}

    })
})

router.post("/getcert/:id", auth, async( req, res) => {
        // target user get user's certification data
        // need auth 
        await Cert.findOne(req.body.id)
        .then(certT => {
            if(!certT) { return res.status(400).json("Not exist certification")}
            //check certification
            if(!(certT.user == req.body.userid || certT.target == req.body.userid)) { return res.status(400).json("no permission, access certification")}
            //check permission -> certification's user, target field 

            return res.status(200).json(certT);
        })
})
// request = userid , certifinum // get certification 

router.post("/writecert/inspection", [ auth, Business_number_inspection ], async(req, res) => {
    return res.status(200).json({
        "Bnumber" : req.body.Bnumber,
        "BCOname" : req.body.BCOname,
        "BCEOname" : req.body.BCEOname,
        "flag" : 1
    }); // frontend , data stream
})
router.post("/writecert", auth, async(req, res) => {
    const { user, target, start_date, end_date, contents, privatekey } = req.body;

    const publickey = 'EOS6ocut4TMw5zV882giNU6SvsByuit91Gpd3EFEExUAxTpn6h62i';
    // const privatekey = '5KTNv57ZGHxZURjzwK1w5hcNcXbNsQQ9pT36vLF6W2yd8FJv8Kb';
    //test3
    if(!(ecc.isValidPrivate(privatekey))) { return res.status(400).json("err : unvalid private key")}

    const hash_null = ecc.sha256("NULL");

    //올바르지 않을시, action 할 때 오류
    //set private key ; if use App, don't need this.
    eos_config.keyProvider.push(privatekey);
    const eos = Eos(eos_config);

   
    //----------------------------------------------
    await User.findOne({ userid: user}) // 유저가 존재하는지 확인
    .then((usert) =>{
        if(!usert){
            return res.status(400).json("Err : Not exist userid");
        }
        Global.findOne({manager: "alibi"}) // ceritifnum 자동 증가 기능 ...
        .then((tmp) => {
            if(!tmp){ 
                let globalt = new Global({
                    manager: "alibi",
                    certifinum: 0
                });
                console.log("11");
                globalt.save()
                        .catch(err => { return res.status(400).json("Err : " + err)})
            }
            const certifi_count = tmp.certifinum; //global의 certifinum으로 계약서 번호 지정
            console.log(certifi_count);
            
            let newCer = new Cert({
                user,
                target,
                certifinum : certifi_count,
                company : "req.body.BCOname", ///////
                start_date,
                end_date,
                contents,        
            });
            const cert_hash = ecc.sha256(newCer.toString('base64'));
            const cert_sign = ecc.sign(cert_hash, privatekey);
            //작성한 계약서 해시
            //서명
            eos.transaction({
                actions: [{
                    account: "seungbaenote",
                    name: "setcerthashq",
                    data: {
                        user: usert.eos_accountname,
                        certifinum: certifi_count,
                        certifihash: cert_hash,
                        retirementhash: hash_null,
                        sign: cert_sign
                    },
                    authorization: [{
                        actor: usert.eos_accountname,
                        permission: "active"
                    }]
                }]
            })
            .then(result => {
                console.log(result);
    
                eos.getTableRows({
                    code:"seungbaenote",
                    scope:"seungbaenote",
                    table: 'certhashqes',
                    json: true,
                })
                .then(result=>{ // 제대로 certifinum이 등록되었는지 확인
                   // for(var i = 0; i < result.rows.length; i ++){
                            //if(result.rows[i].certifinum == certifi_count){
                                tmp.certifinum = tmp.certifinum + 1;
                                tmp.save().catch(err => {console.log("11");return res.status(400).json("Err : " + err )});
                                console.log(newCer);
                                newCer.save() //certifinum 있으면 만든 계약서 DB에 저장
                                        .catch(err => { console.log("33");return res.status(400).json("Err : " + err)});
                                        return res.status(200).json("Success create certification num." + certifi_count );
                               
                           // }
                           // else{
                           //     return res.status(400).json("Failure create certification num." + certifi_count);
                          // }
                   // }
                })
                .catch(err => {
                    return res.status(400).json("Err : " + err);
                });
            })
            .catch(err => {
                return res.status(400).json("Err : " + err);
            });
        })
        .catch(err => {
            return res.status(400).json("Err : " + err);
        });
    })
    .catch(err => {
        return res.status(400).json("Err : " + err);
    });
})
// status == 1, cert에 user가 계약서 생성 후 서명. 블록체인에 저장
// 이 작업을 하는 사람이 기업(점주) | 사업자등록번호 인증 필요 

router.post("/receivecert", auth, async( req, res) => {
    const { userid, certifinum, privatekey } = req.body;

    var flagInGetTable = -1;
    const hash_null = ecc.sha256("NULL");

    const publickey = 'EOS7dPgAMg5sn9sgZxWJTVwtCD9tMMhT1WvcJqZYgvYdgPDNK2GJB';
    //const privatekey = '5J3T6UU9emYCK4wrQQuvEzhfvJ9uW94Z7W9DuN62dkTbtMSPYcn';
    //test4

    if(!(ecc.isValidPrivate(privatekey))) { return res.status(400).json("err : unvalid private key")}


    eos_config.keyProvider.push(privatekey);
    const eos = Eos(eos_config);

    await Cert.findOne({certifinum: req.body.certifinum}) //계약서를 certifinum으로 찾음
    .then(certT =>{
        if(!certT){return res.status(400).json("Not exist certification")}
        if(!(certT.user == req.body.userid || certT.target == req.body.userid)) { return res.status(400).json("no permission, access certification")}
        //계약서 권한 확인

        eos.getTableRows({
            code:"seungbaenote",
            scope:"seungbaenote",
            table: 'certhashqes',
            json: true,
        })
        .then(result =>{
            for(var i = 0; i < result.rows.length; i ++){ //블록체인에서 certifinum으로 찾아온다
                if(result.rows[i].certifinum == certifinum){
                    flagInGetTable = i;
                }
            }
            if(flagInGetTable == -1) { return res.status(400).json("Not exist certification in blockchan")}
            if(!result.rows[flagInGetTable].status == 1) { return res.status(400).json("wrong status. contact to manager")}
            //status가 올바르지 않거나, 존재하지 않는 경우

            const getid = certT.user; //user의 공개키를 가져옴 ( 검증을 위해 )
            User.findOne({ userid: getid })
            .then( user =>{
                const _publickey = user.eos_publickey;
                const cert_hash = ecc.sha256(certT.toString('base64'));

                const sign_cert = result.rows[flagInGetTable].usersign[0];
                const check_sign = ecc.verify(sign_cert, cert_hash, _publickey);
                //블록체인과 비교하여 검증
                if(cert_hash != result.rows[flagInGetTable].certifihash){return res.status(400).json("no matched _ certification")}
                if(!check_sign) { return res.status(400).json("no matched _ certification")}

                const my_sign = ecc.sign(cert_hash, privatekey); //user의 서명에 target의 서명

                User.findOne({ userid:certT.target })
                .then(me =>{
                     const my_eos_account = me.eos_accountname 

                     eos.transaction({
                        actions: [{
                            account: "seungbaenote",
                            name: "setcerthashq",
                            data: {
                                user: my_eos_account,
                                certifinum: certifinum,
                                certifihash: cert_hash,
                                retirementhash: hash_null,
                                sign: my_sign
                            },
                            authorization: [{
                                actor: my_eos_account,
                                permission: "active"
                            }]
                        }]
                    })
                    .then(result_tx => { console.log(result_tx); return res.status(200).json("Success")})
                    .catch(err => {return res.status(400).json("Err : " + err)}) 
                }).catch(err => { return res.status(400).json("Err : " + err)})               
            }).catch(err => { return res.status(400).json("Err : " + err)})
        }).catch(err => { return res.status(400).json("Err : " + err)})
    }).catch(err => { return res.status(400).json("Err : " + err)})
})
// status == 2 , input target's sign

router.post("/inputretirement", auth, async( req, res) => {
    const { userid,certifinum,retirement, privatekey  } = req.body;
    //퇴직날 등록 시작

    var flagInGetTable = -1;
    const hash_null = ecc.sha256("NULL");
    const retirement_hash = ecc.sha256(retirement);
    if(!retirement) { return res.status(400).json("input retirement date");}

    const publickey = 'EOS6ocut4TMw5zV882giNU6SvsByuit91Gpd3EFEExUAxTpn6h62i';
   // const privatekey = '5KTNv57ZGHxZURjzwK1w5hcNcXbNsQQ9pT36vLF6W2yd8FJv8Kb';
    if(!(ecc.isValidPrivate(privatekey))) { return res.status(400).json("err : unvalid private key")}

    //test3

    eos_config.keyProvider.push(privatekey);
    const eos = Eos(eos_config);
    if(hash_null == retirement_hash){ //퇴직날을 입력하지않으면
        return res.status(400).json("input retirement date !");
    }

    await Cert.findOne({certifinum: req.body.certifinum})//계약서를 찾음
    .then(certT =>{
        if(!certT){return res.status(400).json("Not exist certification")}
        if(!(certT.user == req.body.userid || certT.target == req.body.userid)) { return res.status(400).json("no permission, access certification")}

        eos.getTableRows({
            code:"seungbaenote",
            scope:"seungbaenote",
            table: 'certhashqes',
            json: true,
        })
        .then(result_table =>{
            for(var i = 0; i < result_table.rows.length; i ++){ 
                if(result_table.rows[i].certifinum == certifinum){
                    flagInGetTable = i;
                }
            }
            if(flagInGetTable == -1) { return res.status(400).json("Not exist certification in blockchan")}
            if(result_table.rows[flagInGetTable].status != 2) { return res.status(400).json("wrong status. contact to manager")}
        
            const getid = certT.target; //target의 공개키를 가져옴 ( 검증을 위해 )
            User.findOne({ userid: getid })
            .then( user => { //먼저 certification의 서명을 검증
                const _publickey = user.eos_publickey;
                const cert_hash = ecc.sha256(certT.toString('base64'));  
                const sign_cert = result_table.rows[flagInGetTable].targetsign[0];

                const check_sign = ecc.verify(sign_cert, cert_hash, _publickey);
                /////////////////
                if(cert_hash != result_table.rows[flagInGetTable].certifihash){return res.status(400).json("no matched _ certification")}
                if(!check_sign) { return res.status(400).json("no matched _ certification")}
                
                //검증완료시, 퇴직서 등록 진행
                var newRetire = new Retiremnet({ //retirement 스케마 생성
                    certifinum : certT.certifinum,
                    retire_date : retirement
                });
                const retire_hash2 = ecc.sha256(newRetire.toString('base64'));
                const retire_sign = ecc.sign(retire_hash2, privatekey);
       
                User.findOne({userid:certT.user})
                .then(me => {
                    eos.transaction({
                        actions: [{
                            account: "seungbaenote",
                            name: "setcerthashq",
                            data: {
                                user: me.eos_accountname,
                                certifinum: certT.certifinum,
                                certifihash: hash_null,
                                retirementhash: retire_hash,
                                sign: retire_sign
                            },
                            authorization: [{
                                actor: me.eos_accountname,
                                permission: "active"
                            }]
                        }]
                    })
                    .then(result_tx => {
                        console.log(result_tx);
                        newRetire.save() // retirement 해시 저장 완료하면 db에 retirement 저장
                        .catch(err => { return res.status(400).json("Err : " + err); });   
                        res.status(200).json("Success!");   
                    }).catch(err => { return res.status(400).json("Err : " + err); });
                }).catch(err => { return res.status(400).json("Err : " + err); });
            }) .catch(err => { return res.status(400).json("Err : " + err); });  
        }).catch(err => { return res.status(400).json("Err : " + err); }); 
    }).catch(err => { return res.status(400).json("Err : " + err); }); 
})
// status == 3, input retirement day, and target's signcode

router.post("/receiveretirement", auth, async( req, res) => {
    const { userid, certifinum, privatekey } = req.body;

    var flagInGetTable = -1;
    const hash_null = ecc.sha256("NULL");

    const publickey = 'EOS7dPgAMg5sn9sgZxWJTVwtCD9tMMhT1WvcJqZYgvYdgPDNK2GJB';
    //const privatekey = '5J3T6UU9emYCK4wrQQuvEzhfvJ9uW94Z7W9DuN62dkTbtMSPYcn';
    //test4

    if(!(ecc.isValidPrivate(privatekey))) { return res.status(400).json("err : unvalid private key")}


    eos_config.keyProvider.push(privatekey);
    const eos = Eos(eos_config);

    await Cert.findOne({certifinum: req.body.certifinum})
    .then(certT => {
        if(!certT){return res.status(400).json("Not exist certification")}
        if(!(certT.user == req.body.userid || certT.target == req.body.userid)) { return res.status(400).json("no permission, access certification")}
       
        eos.getTableRows({
            code:"seungbaenote",
            scope:"seungbaenote",
            table: 'certhashqes',
            json: true,
        })
        .then(result =>{
            for(var i = 0; i < result.rows.length; i ++){
                if(result.rows[i].certifinum == certifinum){
                    flagInGetTable = i;
                }
            }
            if(flagInGetTable == -1) { return res.status(400).json("Not exist certification in blockchan")}
            if(result.rows[flagInGetTable].status != 3) { return res.status(400).json("wrong status. contact to manager")}
 
            const getid = certT.user;
            User.findOne({ userid: getid })
            .then( user =>{
                Retiremnet.findOne({certifinum: certT.certifinum})
                .select("-__v")
                .then(ret => {
                    const _publickey = user.eos_publickey;
                    
                    const retirehash = ecc.sha256(ret.toString('base64'));/////////////////////////////////


                    const sign_retire = result.rows[flagInGetTable].usersign[1];
                    const check_sign = ecc.verify(sign_retire, retirehash, _publickey);
                    if(!check_sign) { return res.status(400).json("no matched _ retirement")}

                    const my_sign = ecc.sign(retirehash, privatekey);

                    User.findOne({userid: certT.target})
                    .then( me =>{
                        eos.transaction({
                            actions: [{
                                account: "seungbaenote",
                                name: "setcerthashq",
                                data: {
                                    user: me.eos_accountname,
                                    certifinum: certT.certifinum,
                                    certifihash: hash_null,
                                    retirementhash: retirehash,
                                    sign: my_sign
                                },
                                authorization: [{
                                    actor: me.eos_accountname,
                                    permission: "active"
                                }]
                            }]
                        })
                    .then(result => {
                        console.log(result);
                        return res.status(200).json("Sueccess!");
                        }).catch(err => {return res.status(400).json("Err : " + err)})
                    }).catch(err => {return res.status(400).json("Err : " + err)})
                }).catch(err => {return res.status(400).json("Err : " + err)})
            }).catch(err => {return res.status(400).json("Err : " + err)})    

        }).catch(err => {return res.status(400).json("Err : " + err)})   

    }).catch(err => {return res.status(400).json("Err : " + err)})   
})
// status == 4, input target's signcode



module.exports = router;
