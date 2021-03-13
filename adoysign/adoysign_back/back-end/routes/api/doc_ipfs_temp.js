const router = require("express").Router();
const IPFS = require('ipfs-core');
const auth = require("../../util/auth");

async function putIPFS(data){
    const ipfs = await IPFS.create()
    const { cid } = await ipfs.add(data);

    console.log(cid);
}

router.post('/tmp', auth ,(req,res) =>{

})





module.exports = router;