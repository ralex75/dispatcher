const fs=require("fs")
const moment = require('moment')
const express = require('express');
const router = express.Router();
const {sendMail} =require("./mailer")
const {getUser} = require('./user') 


/*const dump=(fileName,data)=>{

    let path=__dirname+`/../logs/${fileName}.txt`
    let content="==================================\n"
    content+=moment().format("DD/MM/YYYY HH:MM")+"\n";
    content+="=====================================\n"
    content+=data+"\n"
    
    fs.appendFileSync(path,content)

}*/

router.post("/", async (req,res)=>{
    let user=req.body.user;
    
    user= await getUser(user.uuid)

    if(!user) return  res.status(500).json({"err":`No user found`})
    let status = user.isAuthorized ? "ok" : "bad"
    let subject=`form-web - ${status} user status: ${user.name} ${user.surname}`
    let from='supporto@roma1.infn.it'
    let to=from;
   
    const {templates}=require("./templates")

    let txt=`<pre>${templates.completeUserInfo(user)}</pre>`
     
    sendMail(from,to,subject,txt).then(res=>{
        console.log(`${subject}`)
    }).catch(err=>{
        console.log(err);
    }).finally(_=>{
        res.json({"txt":`Notification sent`})
    })

  

})


module.exports=router;