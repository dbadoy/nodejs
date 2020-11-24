var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var certSchema = new Schema({
    user:  {
        type : String,
        required : true
    },
    target: {
        type : String,
        required : true
    },
    company: {
        type: String,
        required: true
    },
    certifinum:  { 
        type : Number,
        unique: true,
        required : true
    },
    start_date: {
        type : String,
        required : true
    },
    end_date: 
    {
        type : String,
        required : true
    },
   contents: [String],
    write_date: { 
        type: Date, default: Date.now() 
    }
}, {
    versionKey: false
});


const Cert = mongoose.model("cert", certSchema)
module.exports = Cert;
