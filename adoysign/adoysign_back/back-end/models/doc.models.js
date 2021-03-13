const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const docSchema = new Schema({
      user : {
          type: String,
          required: true
      },
      title: {
          type: String
      },
      docnum : {
          type: Number,
          unique: true,
          required: true
      },
      doc : {
          type: String,
          required: true
      }
});



const Doc = mongoose.model("Doc", docSchema);
module.exports = Doc;