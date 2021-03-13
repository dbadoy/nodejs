const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var validateEmail = function (email) {
    var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
  };

  const userSchema = new Schema(
    {
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validateEmail, "Please fill a valid email address"],
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          "Please fill a valid email address",
        ],
      },
      name: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
      eos_account: {
        type: String,
        unique: true,
        required: true,
      },
      eos_publickey: {
        type: String,
        unique: true,
        required: true,
      },
      

      //phone_verified: { type: Boolean, required: true },
      email_verified: { type: Boolean, required: true, default: false },
      key_for_verify: { type: String, required: false }
    },
    {
      timestamps: true,
    }
  );



const User = mongoose.model("User", userSchema);
module.exports = User;