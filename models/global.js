const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var globalSchema = new Schema ({
    manager :{
        type: String,
        default:"alibi"
    },
    certifinum : {
        type: Number,
        default: 0
    },
    applynum : {
        type: Number,
        default: 0
    }
});




const Global = mongoose.model("global", globalSchema);
module.exports = Global;