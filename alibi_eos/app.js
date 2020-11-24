var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
const cors = require("cors");
require('dotenv').config();

//app.use(cors());
app.use(cors({
    origin: true,
    credentials: true
}));

/*app.options('/', function(req, res, next) {
    res.set({'access-control-allow-origin':'*'});
    req.method = req.headers['access-control-request-method'];
    res.send(data);
});*/


app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

const port = process.env.PORT;
const uri = process.env.MONGOURI;

var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function(){
    console.log("Connected to mongod server");
});
mongoose.connect(uri);

const userRouter = require("./routes/api/user");
app.use('/user', userRouter);

const certRouter = require("./routes/api/cert");
app.use('/cert', certRouter);

const nftRouter = require("./routes/api/nft");
app.use('/nft', nftRouter);

const testRouter = require("./tmp");
app.use('/tmp', testRouter);



app.listen(port, () => {
    console.log("Server is running on port:" + port);
});
