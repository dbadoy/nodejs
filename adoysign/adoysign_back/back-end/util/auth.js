const jwt = require("jsonwebtoken");
const { request } = require("express");

const crypto = require('crypto');
const bcrypt = require("bcryptjs");

function auth(request, response, next){
    if(!request.headers.authorization){
        response.status(400).json("No token...")
    }
    const token = request.headers.authorization.split('Bearer ')[1]   // test
    if(!token){
        response.status(401).json("No available token...");
    }else{
        try{
            const decoded = jwt.verify(token, process.env.jwtSecret);
            if(request.body.eos_account == decoded.eos_account || request.query.eos_account == decoded.eos_account){
                next()
            }else{
                response.status(400).json("Invalid token");
            }
        } catch(e){
            response.status(400).json("Invalid token");
        }
    }
}

function emailAuth(request, response, next) {
    const token = request.params.key
    const decoded = jwt.verify(token, process.env.jwtSecret);
    console.log(decoded.id)
    console.log(request.userid);

    if (!token) {
        response.status(401).json("No token available, authorization denied!");
    } else {
        try {
            
            //   Verify Token     
            // Adding user data from payload into request for next
            request.userid = decoded.id;
            next();
        } catch (e) {
            response.status(400).json("Invalid Token");
        }
    }
}

module.exports = {auth, emailAuth};