// In REST API

const router = require("express").Router();
const IPFS = require('ipfs-core');

router.post('/set', async(req, res) =>{
  const image = req.body;  // type : string !  ※Send to buffer but receive as string
  const ipfs = await IPFS.create();
  
  const cid = await ipfs.add(image);
  
  return res.status(200).json( {"cid" : cid.path } )

})
// example
// cid = QmeW2bYmXsu3pnSTpRCEwqyoE8pa2oaH6eW7qfiz4qbahn
// https://ipfs.io/ipfs/QmeW2bYmXsu3pnSTpRCEwqyoE8pa2oaH6eW7qfiz4qbahn
// The String(base64) is uploaded. Not an image


// solution
router.post('/modified_set', async(req, res) =>{
  const image = req.body;
  const ipfs = await IPFS.create();
  
  const my_image = new Buffer.from(image, 'base64');
  
  const cid = await ipfs.add(my_image);
  
  return res.status(200).json( {"cid" : cid.path } )

})
// example
// cid = QmdYge2mPLaSt8psSShvwg7ygqAbtfVa6uZpfUBaB65Yny
// https://ipfs.io/ipfs/QmdYge2mPLaSt8psSShvwg7ygqAbtfVa6uZpfUBaB65Yny
// Images uploaded

