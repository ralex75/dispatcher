
const express = require('express');
const router = express.Router();
const {getUserLDAP} = require('./ldap.js') 



//check if exists email address in ldap
router.get("/exists/:val",async (req,res)=>{
    var email=req.params.val.toLowerCase();
    var exists=false;
    try {
        
        users=await getUserLDAP(`(mail=${email})`);
        //console.log(users);
        exists = users && users.length>0;
        //console.log(exists);

    }
    catch(err)
    {
        res.status(500).json({"err":err})
    }

    res.json({"exists": exists})
})

module.exports=router;