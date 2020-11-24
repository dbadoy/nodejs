const mongoose = require("mongoose");
const Schema = mongoose.Schema;


var tnftSchema = new Schema ({
    nftid : Number,
    encnft : String
})


const Tnft = mongoose.model("tnft", tnftSchema);
module.exports = Tnft;