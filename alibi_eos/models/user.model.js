const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var validateEmail = function(email){
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

const userSchema = new Schema(
    {
        userid : {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        eos_accountname:{
            type: String,
            required: true,
        },
        eos_publickey: {
            type: String,
        },

        phone_verified: { type: Boolean, required: true },
        key_for_verify: { type: String, required: false } // cert verify [ certifinum, signcode]
    }
);
const User = mongoose.model("User", userSchema);
module.exports = User;
