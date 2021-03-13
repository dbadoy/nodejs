const router = require("express").Router();

const adoysign = require("../../../adoysign_module/lib/adoysign");

const { auth } = require("../../util/auth");
const Eos = require('eosjs');
const { async } = require("crypto-random-string");

const codeLeng = 5;

//const eos = Eos(eos_config);
function sleep (delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
 }

router.post("/create", auth, async( req, res )=> {
    const { eos_account, privatekey } = req.body;

    const signCode = adoysign.gen(codeLeng);
    adoysign.eosSet(privatekey)
    .then( eos_config => {
        const eos = Eos(eos_config);

        adoysign.setCreateAction(eos, eos_account, signCode)
        .then(myAction => {
            eos.transaction({actions: myAction})
            .then(result => {
                adoysign.getSignnum(eos, signCode)
                .then(signnum =>{
                    return res.status(200).json({"signnum" : signnum,"signcode" : signCode})
                }).catch(err => { return res.status(400).json("err(getsignnum) : " + err)})

               
            }).catch(err => { return res.status(400).json("err(send action) : " + err)})   
        }).catch(err => { return res.status(400).json("err(create action) : " + err)})
    }).catch(err => { return res.status(400).json("err(eosSet) : " + err)})
})

router.post("/checkCode", async(req, res) => {
    const { signnum, signcode } = req.body;

    adoysign.eosSet()
    .then( eos_config => {
        const eos = Eos(eos_config);

        adoysign.compare(eos, signnum, signcode)
        .then(result => {
            return res.status(200).json({"result": result});
        }).catch( err => { return res.status(400).json("Err in compare : " + err)})
    })
})

router.post('/getsignnum', auth, async(req, res) => {
    const { eos_account, signCode } = req.body;

    adoysign.eosSet('')
    .then( eos_config => {
        const eos = Eos(eos_config);
        adoysign.getSignnum(eos, signCode)
        .then(signnum =>{
            eos.getTableRows({
                code:"adoycontract",
                scope:"adoycontract",
                table: 'signs', 
                lower_bound: signnum, 
                json: true,
            })
            .then( result => {
                if(!result.rows[0]) { return res.status(201).json({ result : 1})}
                if(result.rows[0].use) { return res.status(201).json({result : 2})}
                return res.status(200).json({"signnum" : signnum})
            })  
        }).catch(err => { return res.status(400).json("err(getsignnum) : " + err)})  
    }).catch(err => { return res.status(400).json("err(eosSet) : " + err)})   
})


module.exports = router;