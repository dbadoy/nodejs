const jwt = require("jsonwebtoken");
const { request } = require("express");

let User = require("../models/user.model");
const crypto = require('crypto');
const bcrypt = require("bcryptjs");
const axios = require("axios");

function auth(request, response, next){
    //const token = request.header("x-auth-token"); -- required front set ...
    if(!request.headers.authorization){
        response.status(400).json("No token...")
    }
    const token = request.headers.authorization.split('Bearer ')[1]   // test
    if(!token){
        response.status(401).json("No available token...");
    }else{
        try{
            const decoded = jwt.verify(token, process.env.jwtSecret);
            if(request.body.userid == decoded.id){
                next()
            }else{
                response.status(400).json("Invalid token");
            }
        } catch(e){
            response.status(400).json("Invalid token");
        }
    }
}

function phone_auth(request, response, next){
    if(!request.headers){
        response.status(400).json("No token...")
    }
    const token = request.headers.authorization.split('Bearer ')[1];

    if(!token){
        response.status(401).json("No available token..");
    }else{
        try{
            const decoded = jwt.verify(token, process.env.jwtSecret);
            if(request.body.verifycode == decoded.id || process.env.PHONE_VERIFY_CODE == decoded.id){
                next()
            }else{
                response.status(400).json("Wrong verify code");
            }
        }catch(e){
            response.status(400).json("Invalid token");
        }
  
    }
}

function Business_number_inspection(request, response, next){
    var reg1 = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi
    var reg2 = /[a-z]/gi


    const params = new URLSearchParams();
    params.append('bizNo', request.register_number);

    axios({
        method:"post",
        url: "https://www.pps.go.kr/gpass/gpassCompany/selectCompanyInfo.do",
        params
    })
    .then( result => {
        var temp = JSON.stringify(result.data);
        var index = temp.indexOf("사업자등록번호 조회목록");

        var temp2 = temp.substr(index);

        temp2 = temp2.replace(reg1, "");
        temp2 = temp2.replace(reg2, "");

        temp2 = temp2.split(" ");

        if( !temp2[8]){ return response.status(400).json("Err : Incorrect business registration number")}
        else{
            req.body.Bnumber = tmep2[8];
            req.body.BCOname = temp2[10];
            req.body.BCEOname = temp2[11];
            next()
        }
    })
    .catch( err => { return response.status(400).json("Err : " + err)})
}

function getPRIV(req, res, next){
    const token = req.headers.authorization.split('Bearer ')[1];
    const decoded = jwt.verify(token, process.env.jwtSecret);
    if(!req.body.password){
        return res.status(400).json("Err : " + "Not entered password")
    }
    User.findOne({ userid: decoded.id })
    .then((user) =>{
        bcrypt
            .compare(req.body.password, user.password)
            .then((isMatch) => {
                if(!isMatch){
                     return res.status(400).json("wrong password");
                }else{
                    const PRIV = process.env.SERVER_PRIV.replace(new RegExp('\\\\n', '\g'), '\n');
                    aesE_privateKey = crypto.privateDecrypt(PRIV, Buffer.from(user.eos_privatekey, 'base64'));

                    const decipher = crypto.createDecipher('aes-256-cbc', req.body.password);
                    var privateKey = decipher.update(aesE_privateKey.toString('base64'), 'base64', 'utf8');
                    privateKey += decipher.final('utf8');       
                    
                    req.body.key = privateKey;
                    next();
                }
    //console.log(eos_config.keyProvider);
            }).catch(err => { return res.status(400).json("err : " + err)});
    }).catch(err => { return res.status(400).json("err : " + err)});
}


module.exports = {auth, phone_auth, getPRIV, Business_number_inspection};