const router = require("express").Router();

let User = require("../../models/user.models");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { auth, emailAuth } = require("../../util/auth");
const nodemailer = require('nodemailer');

const eos_config = {
    expireInSeconds: 60,
    broadcast: true,
    debug: false,
    sign: true,
    httpEndpoint: 'https://jungle3.cryptolions.io:443',
    keyProvider: [
    ],
    chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
}; 
const Eos = require('eosjs');


const { encrypt, decrypt } = require("eos-encrypt");
const ecc = require("eosjs-ecc/lib/api_common");

router.post("/register", async (request, response) => {
    const eos = Eos(eos_config);
    console.log("REGISTER REQUEST")
    const { email, password, name, eos_account, eos_publickey, eos_privatekey } = request.body;
    // Checking if user exists
    await User.findOne({ email: email })
        .then(async (user) => {
            if (user) {
                return response.status(400).json("Aleady exist user.");
            }
            // If user does not exist
            else {
                await User.findOne({eos_account : eos_account})
                .then( async chk => {       
                    if(chk){ return response.status(400).json("Aleady exist eos_account");}
                    if(!(ecc.isValidPrivate(eos_privatekey) && ecc.isValidPublic(eos_publickey))){ 
                        
                        return response.status(400).json("err : unvalid private key")
                    }
                    else{
                        try{
                            let dec_data1 = encrypt(eos_privatekey, eos_publickey, "null");
                            eos.getKeyAccounts(eos_publickey)
                            .then( check_eos => {
                                if(!(check_eos.account_names == eos_account)){ return response.status(201).json({flag: 1})}
                            })

                        }catch(e){
                            return response.status(400).json("err : unvalid key")
                        }

                        const newUser = new User({
                            email,
                            password,
                            name,
                            eos_account,
                            eos_publickey,
                            email_verified: false,
                            key_for_verify: '',
                            // SSN
                        });
                        // Create Salt & Hash
                        bcrypt.genSalt(10, async (err, salt) => {
                            hash = await bcrypt.hash(newUser.password, salt);
                            newUser.password = hash;
                            // Adding newUser to Database
                            newUser
                                .save()
                                .then((user) => {
                                    // Email Verification
                                    let verkey;
                                    // Generating JWT for verification
                                    jwt.sign(
                                        { id: user.id },
                                        process.env.jwtSecret,
                                        {},
                                        (err, token) => {
                                            if (err)
                                                throw err;
                                            verkey = token;
                                            // Updating DB with verification key
                                            User.findOneAndUpdate(
                                                { _id: user._id },
                                                { key_for_verify: verkey },
                                                { new: true },
                                                (err, user, res) => {
                                                    if (err)
                                                        throw err;
                                                        
                                                    const transporter = nodemailer.createTransport({
                                                        service: 'gmail',////
                                                        auth: {
                                                            user: 'adoysign@gmail.com',////
                                                            pass: 'wttqdnakubwfppfl'////adoyTkdls!2
                                                        } //wttqdnakubwfppfl
                                                    });
                                                    const verificationLink = process.env.deploymentURL + 'user/verifyemail/' + user.key_for_verify
        
                                                    const mailOptions = {
                                                        from: 'adoysign@gmail.com',////
                                                        to: user.email,
                                                        subject: 'E-mail Verification',
                                                        html: `<p>Click <a href="${verificationLink}">here</a> to verify your E-mail. <br> <br> Link: ${verificationLink} </p>`
                                                    };
                                                    
                                                    transporter.sendMail(mailOptions, function (error, info) {
                                                        if (error) {
                                                            User.deleteOne({ _id: user._id }, (err) => { console.log("Delete Error: " + err) });
                                                            return response.status(400).json("Send Mail Error: " + error);
                                                        } else {
                                                            return response.status(200).json("회원가입 완료되었습니다. 서비스 이용을 위해 이메일 인증을 부탁드립니다.")
                                                        }
                                                    });
        
                                                })
                                        });
                                })
                                .catch((err) => {
                                    return response.status(400).json("Error: " + err);
                                });
                        });
                    }
                
                })

 
            }
        })
        .catch((err) => {
            return response.status(400).json("Error: " + err);
        });
});

router.post("/login", async (request, response) => {
    console.log('LOGIN REQUEST')
    const { email, password } = request.body;
    // Checking if user exists
    await User.findOne({ email: email })
        .then((user) => {
            // If user does not exist
            if (!user) {
                return response.status(400).json("Non-exist user.");
            }
            else {
                // Check Email Verification status
                if (!user.email_verified) {
                    return response.status(400).json("E-mail verify, first.")
                }
                // Validate Password
                bcrypt
                    .compare(password, user.password)
                    .then((isMatch) => {
                        if (!isMatch) {
                            return response.status(400).json("Invalid credentials!");
                        } else {
                            jwt.sign(
                                { id: user._id, eos_account: user.eos_account },
                                process.env.jwtSecret,
                                {
                                    // expiresIn: 3600,
                                },
                                (err, token) => {
                                    if (err) {
                                        throw err;
                                    }
                                    return response
                                        .status(200)
                                        .json({
                                            token,
                                            user: {
                                                id: user.id,
                                                email: user.email,
                                                eos_account: user.eos_account
                                                // SSN: user.SSN
                                            },
                                        });
                                }
                            );
                        }
                    })
                    .catch((err) => { });
            }
        })
        .catch((err) => {
            return response.status(400).json("Error: " + err);
        });
});

router.post("/mydata", auth, (request, response) => {
    console.log("AUTH REQUEST")
    User.findOne({eos_account: request.body.userid})
        .select("-password")
        .select("-_id")
        .select("-createdAt")
        .select("-updateAt")
        .select("-email_verified")  
        .select("-key_for_verify")
        .then((user) => {
            return response.status(200).json(user);
        })
        .catch((err) => {
            return response.status(400).json("Error: " + err);
        });
});

router.get("/verifyemail/:key", emailAuth, (request, response) => {
    console.log("EMAIL VERIFICATION REQUEST");
    console.log(process.env.deploymentURL)
    User.updateOne({ _id: request.userid }, { email_verified: true })
        .then(() => {
            //return response.status(200).redirect('http://192.168.126.132:8080/user/mydata'); ////
            return response.status(200).json("인증 성공 ... ");
        })
        .catch((err) => {
            return response.status(400).json("Verification Status Update Error: " + err);
        })
})

router.post("/checkid", async( request, response) => {
    const { email } = request.body;

    User.findOne({email: email})
    .then( res => {
        if(res){ return response.status(400).json("Used email"); }
        return response.status(200).json("Valid");
    }).catch( err => { return response.status(400).json("Err in findOne : " + err )})
})

router.post("/checkeosAccount", async( request, response ) => {
    const { eos_account } = request.body

    const eos = Eos(eos_config);
    eos.getAccount(eos_account)
    .then(res => {
        if(res){ return response.status(200).json("Success"); }
        return response.status(400).json("Not exist EOS account !");
    }).catch( err => { return response.status(400).json("Err in eos.getAccount : " + err )})
})

module.exports = router;