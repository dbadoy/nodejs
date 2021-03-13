var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var cors = require('cors');
require('dotenv').config();

app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

const port = process.env.PORT;
const uri = process.env.MONGOURI;

app.use(cors({
    origin: true,
    credentials: true
}));


var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
    console.log("Connected to mongod server");
});
mongoose.connect(uri);

const userRouter = require("./routes/api/user");
app.use('/user', userRouter);

const codeRouter = require("./routes/api/signcode");
app.use('/signcode', codeRouter);

const docRouter = require("./routes/api/document");
app.use('/document', docRouter);



app.listen(port, () => {
    console.log("Server is running on port:" + port);
});
