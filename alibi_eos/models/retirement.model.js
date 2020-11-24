var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var retirementSchema = new Schema({
    certifinum:  { 
        type : Number,
        unique: true,
        required : true
    },
    retire_date: {
        type : String,
    }
}, {_id : false})

const Retirement = mongoose.model("retirement", retirementSchema)
module.exports = Retirement;
