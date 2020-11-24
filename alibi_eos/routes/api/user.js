var account =  process.env.SERVER_EOSACCOUNT;
var key  =  process.env.SERVER_EOSPRIV;
const eos_config = {
    expireInSeconds: 60,
    broadcast: true,
    debug: false,
    sign: true,
    httpEndpoint: 'https://jungle3.cryptolions.io:443',
    keyProvider: [
        key,
    ], // seungbaenote 's private key
    chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
};  // jungle3 's chainId


const router = require("express").Router();

let User = require("../../models/user.model");
let Cert = require("../../models/cert.model");
let Retiremnet = require("../../models/retirement.model");

const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const eosjs_acc = require("eosjs-ecc");
const Eos = require('eosjs');
const { json } = require("body-parser");
const eos = Eos(eos_config);
const ecc = eosjs_acc;
const { auth, phone_auth } = require("../../util/auth")


const rand = require("random-number-csprng");
const randomNumber = require("random-number-csprng");
const { printAsset } = require("eosjs/lib/format");
const { async } = require("crypto-random-string");
const cors = require('cors');

router.get('/', cors(), (req, res) => { res.send('cors!') });



router.post("/register/checkid", async(req, res) => {
    const userid = req.body.userid;
    await User.findOne({userid : userid})
    .then( user => {
        if(!user){
            return res.status(200).json("available userid");
        }
        else{ 
            return res.status(400).json("already exist username");
        }
    })
})

router.post("/register", phone_auth ,async(req, res) => {
    const { userid, password, name, phone, eos_accountname } = req.body;
    await User.findOne({ userid: req.body.userid })
    .then((user)=>{
        if(user){
            return res.status(400).json("already exist username");
        }
        else{
            var check_name = req.body.eos_accountname;

            eos.getAccount(check_name, (error, result) =>{  //check eos account name
                if(!error){
                    return res.status(400).json({"Error": "already exist eos_account Name"});
                }else{
                    var newUser = new User({
                        userid,
                        password,
                        name,
                        phone,
                        eos_accountname,

                        phone_verified: true,
                        key_for_verify: '',
                    });
                    // 핸드폰 인증 완료 -> 핸드폰 입력 form 비활성화 -> register 누를 때, 핸드폰번호까지 request에 담아 전송
                    let userkey = "";
                    ecc.randomKey() // create eos key pair ,// encrypt password
                    .then(privateKey =>{
                        //pulickey ...
                        newUser.eos_publickey = ecc.privateToPublic(privateKey);    
                        //const padding = constants.RSA_PKCS1_PADDING;
                        //encrypt privatekey by AES
                        console.log(privateKey);
                        //const cipher = crypto.createCipher('aes-256-cbc', req.body.password);
                       // var aesE_privateKey =  cipher.update(privateKey, 'utf8', 'base64');
                        //aesE_privateKey += cipher.final('base64');

  
                        //const PUB =  process.env.SERVER_PUB.replace(new RegExp('\\\\n', '\g'), '\n');
                       // rsaE_aseE_privateKey = crypto.publicEncrypt(PUB, Buffer.from(aesE_privateKey.toString('base64'), 'base64'));

                        
                        //newUser.eos_privatekey = rsaE_aseE_privateKey.toString('base64');   
                        userkey = privateKey;      
                    }, err =>{ return res.status(400).json("Error : " + err)})
                    
                    //.catch((err)=>{ return res.status(400).json("Error" + err)});
                    bcrypt.genSalt(10, async (err, salt)=>{
                        hash = await bcrypt.hash(req.body.password, salt);
                        newUser.password = hash;

                        if(!newUser.eos_privatekey){ return res.status(400).json("Error!!")}
                        else{
                        
                                eos.transaction(tr =>{
                                    tr.newaccount({
                                        creator: "seungbaenote",
                                        name: String(newUser.eos_accountname),
                                        owner: newUser.eos_publickey,  
                                        active: newUser.eos_publickey
                                    });
                                    tr.buyrambytes({
                                        payer: "seungbaenote",
                                        receiver: String(newUser.eos_accountname),
                                        bytes: 3000 
                                    });
                                
                                    tr.delegatebw({
                                        from: "seungbaenote",
                                        receiver: String(newUser.eos_accountname),
                                        stake_net_quantity: '1.0000 EOS', 
                                        stake_cpu_quantity: '1.0000 EOS', 
                                        transfer: 0
                                    });
                                }) 
                                .then((resp) =>{
                                    console.log("EOS resp ", resp);
                                    eos.getAccount(check_name, (error, result) =>{
                                        console.log("err");
                                            if(error) return res.status(400).json("error in create new EOS account");
                                    }) 
                                    newUser.save()
                                    .catch(err =>{return res.status(400).json("Err : " + err)});
                                    return res.status(200).json("Register Success!" + {'privatekey' : userkey});     
                                })
                                .catch(err => {return res.status(400).json("Err1 : " + "Use another eos account name >> " + err)})                   
                            }
                    });             
                }
            })
        }
    });
});

router.post("/register/phone", async(req, res) => {
    const uid = process.env.TWILIO_SID;
    const tk = process.env.TIWLIO_TOKEN;
    const sms = require("twilio")(uid, 'd497b4e8dcb3b25a6d27d5b81da37360');
    
    var tmp="";
    for(var i = 0; i<=5; i ++){
        tmp += (await randomNumber(0,9)).toString();
    }

    var verify_msg = "(회원가입)알리바이 인증번호 [" + tmp + "]";
    var tmp_phoneNum = "+8210" + req.body.phone_num;

    sms.messages
        .create({
            body: verify_msg,
            from: process.env.TWILIO_FROM,
            to: tmp_phoneNum
        })
        .then(() => {
            jwt.sign(
                { id : tmp },
                process.env.jwtSecret,
                {
                    //expire set
                },
                (err, token) => {
                    if(err){
                        throw err;
                    }
                    return res
                        .status(200)
                        .json({
                            token,
                            "Success" : "send verify code !"
                        });
                }
            );
            //return res.status(200).json("send verify code ! To " + req.body.phone_num)
        });
});

router.post("/register/phone/check", phone_auth,async(req, res) => {
    jwt.sign(
        { id : process.env.PHONE_VERIFY_CODE },
        process.env.jwtSecret,
        {
            //expire set
        },
        (err, token) => {
            if(err){
                throw err;
            }
            return res
                .status(200)
                .json({
                    token,
                    "Success" : "Verify!"
                });
        }
    );
    
})

router.post("/login", async(req, res) => {

    await User.findOne({ userid: req.body.userid})
        .then((user => {
            
            if(!user){
                return res.status(400).json("Not exist user");
            } 
            else{
                // validate password
                bcrypt
                    .compare(req.body.password, user.password)
                    .then((isMatch) => {
                        if(!isMatch){
                            return res.status(400).json("wrong password");
                        }
                        else{
                            jwt.sign(
                                { id : user.userid},
                                process.env.jwtSecret,
                                {
                                    //expire set
                                },
                                (err, token) => {
                                    if(err){
                                        throw err;
                                    }
                                    return res
                                        .status(200)
                                        .json({
                                            token,
                                            user : {
                                                id : user.userid,
                                                eos_account : user.eos_accountname,
                                                name : user.name  
                                            },
                                        });
                                }
                            );
                        }
                    }).catch((err) => { return res.status(400).json("Error : " + err) });
            }
        }));
});

router.post("/userdata", auth, (req, res) => {
    console.log(req.body.userid);
    const token = req.headers.authorization.split('Bearer ')[1] 
    const decoded = jwt.verify(token, process.env.jwtSecret);
    console.log(decoded.id);
    User.findOne( {userid: decoded.id} )
        .select("-password")
        .select("-eos_privatekey")
        .select("-_id")
        .then((user) => {
            return res.status(200).json(user);
        })
        .catch((err) => {
            return res.status(400).json("Error : " + err);
        });
});

router.get("/usercertlist", auth, async(req, res) =>{
    eos.getTableRows({
        code:"alibicontrac",
        scope:"alibicontrac",
        table: 'certhashqes',
        json: true,
    })
    .then(result => {
        Cert.find().or([{user : req.body.userid}, {target : req.body.userid}])
        .select("-_id")
        .then(certT => {
            if(!certT) { return res.status(400).json("No certification")}
            let mystatArr = new Array();
            
            for(var i = 0; i < certT.length; i ++){
                for(var j = 0; j < result.rows.length; j ++){
                    if(certT[i].certifinum == result.rows[j].certifinum){
                        let mystat = new Object();
                        mystat.certifinum = certT[i].certifinum;
                        mystat.status = result.rows[j].status;
                        mystatArr.push(mystat);
                    }
                }
            }
            return res.status(200).json({certT, mystatArr})
        }).catch(err => { return res.status(400).json("Err : " + err)})
    }).catch(err => { return res.status(400).json("Err : " + err)})
})


//frontend
router.get("/logout", auth, async( req, res ) =>{


})

// test code [ decrypt eos_privatekey ] get privatekey 
router.post("/tmp", async(req, res)=>{
    await User.findOne({ userid: req.body.userid })
    .then((user) =>{
        const PRIV = process.env.SERVER_PRIV.replace(new RegExp('\\\\n', '\g'), '\n');
        aesE_privateKey = crypto.privateDecrypt(PRIV, Buffer.from(user.eos_privatekey, 'base64'));
        console.log(aesE_privateKey.toString('base64'));

        const decipher = crypto.createDecipher('aes-256-cbc', req.body.password);
        var privateKey = decipher.update(aesE_privateKey.toString('base64'), 'base64', 'utf8');
        privateKey += decipher.final('utf8');

        console.log(privateKey);
        return res.status(200).json("Success : getPrivatekey")
    })
})

router.get("/tmp2", async(req, res) => {
    const privateKey = "123456789a";
    var tplainText = {
        "test" : "test",
        "test2" : "test2"
    };
    var plainText = JSON.stringify(tplainText);
    const cipher = crypto.createCipher('aes-256-cbc', privateKey);
    var aesE_privateKey =  cipher.update(plainText, 'utf8', 'base64');
    aesE_privateKey += cipher.final('base64');
    console.log(aesE_privateKey);


    var input_data = "givMf6I/NU8SLyv1F4fuKIwPh0jWq+R6wnNJ6ZqS6cQ=";
    const decipher = crypto.createDecipher('aes-256-cbc', privateKey);
    var decrypted = decipher.update(input_data.toString('base64'), 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    console.log(decrypted);
} )

module.exports = router;

                       
