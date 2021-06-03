const express = require('express');
const router = express.Router();
const SSH2Promise = require('ssh2-promise');
const {getUserLDAP} = require('./ldap.js') 
const moment = require('moment')


const sshConf={
		host: 'freezer.roma1.infn.it',
		username: 'root',
		password: '4h34dBCK',
		baseDir: '/data/vm+servizi/bckuser'
	};


router.get("/options",async (req,res)=>{
    let userid=req.userid; //infnUUID
    let username=""
    let restoreOpts=[]
    const MIN_SIZE=120000 //bytes
    const GRACE_TIME=365; //days
    
    try
    {
            user=await getUserLDAP(`(infnUUID=${userid})`);
            
            user=user[0]

            if(!user) throw Error("No user found")

            username=user.uid; //username

            if(!username) throw Error("No username")

            let ssh = new SSH2Promise(sshConf);
		
            let userDirDate=await ssh.exec(`ls -lart --time-style="+%Y%m%d" ${sshConf.baseDir} | grep ${username} | awk '{print $6}'`)

            if(!userDirDate) throw Error("No backup user dir found.")

            let canRestoreData = moment().diff(moment(userDirDate.trim()),'days')< GRACE_TIME

            if(!canRestoreData) throw Error("Restore data period exceed.")

            let data = await ssh.exec(`ls -ls ${sshConf.baseDir}/${username} | awk '{print $6,$10}' | grep -e mailbox -e vdump`);

            //array: file size - file name
            data=data.split("\n")

            data.forEach(i=>{
                let file=i.split(" ")
                //size
                if(parseInt(file[0])>=MIN_SIZE)
                {
                    let key=file[1].indexOf("mailbox")>0 ? "mail" : "afs";
                    restoreOpts.push(key)
                }
            })

            //per ora non diamo opzione di restore AFS
            delete restoreOpts["afs"];
   
    }
    catch(exc)
    {
        let msg=`"checking restore options for user ${username} failed: ${exc}`
        //restoreOpts=msg;
        console.log(msg)
    }
    finally{
        return res.json({"options":restoreOpts})
    }

})

module.exports=router;