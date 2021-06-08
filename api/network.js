var express = require('express');
var router = express.Router();
var {nqdb}=require("./db");
const {authToken} =require('./auth')


//check if exists
router.get("/exists/:val",(req,res)=>{
    var value=req.params.val.toLowerCase();
    nqdb.any(`select count(*) from vw_network_status_ex_3 where lower(host_name)='${value}' or lower(host_mac::text)=lower('${value}')`).then(data=>{
        res.status(200).json(data[0].count>0);
    }).catch(err=>{
        console.log(err)
        res.sendStatus(500);
    })
})

//check if exists
router.get("/hosts/:mac",(req,res)=>{
    var value=req.params.mac.toLowerCase();
    nqdb.any(`select loc_id ,loc_building as "build",loc_floor as "floor",loc_name, host_name,host_domain,host_mac,pp_port_code from vw_network_status_ex_3 where lower(host_mac::text)=lower('${value}')`).then(data=>{
        res.status(200).json(data[0]);
    }).catch(err=>{
        console.log(err)
        res.sendStatus(500);
    })
})


var dnslookup=(name)=>{
    var dns = require("dns");
    return new Promise((resolve,reject)=>{
        dns.resolve(name,(err,addr)=>{
            
            if(err)
            {
                console.log(err)
                let ecode=err.errno || err.code
                if(ecode!='ENOTFOUND')
                {
                    reject(err);
                }
                
            }
            resolve(addr || []);
        })
    })
   

}



router.get("/lookup/:name",async (req,res)=>{

    try{
        var result=await dnslookup(req.params.name);
        res.send(result);
    }
    catch(exc)
    {
        res.status(500).send({"exc":exc});
    }
       
});



//lista nodi
router.get("/hostlist",authToken,async (req,res)=>{
    //var uid=req.params.uid.toLowerCase();
    //const {getUser} = require('./user')
    
    //let user=await getUser(req.userid);
    const uid=req.userid;

    nqdb.any(`select loc_id ,loc_building as "build",loc_floor as "floor",loc_name,host_full_name,host_ip, host_name,host_domain,upper(host_mac) as \"host_mac\", host_is_vm as \"host_vm\", pp_port_code,pp_port_alias,sw_port_vlanid as \"vlanid\" 
              from vw_network_status_ex_3 vw,person p where p.cf=vw.admin_cf and lower(p.infn_uuid)=lower('${uid}')
              order by loc_building,loc_name,pp_port_alias`).then(data=>{
        res.status(200).json(data);
    }).catch(err=>{
        console.log(err)
        res.sendStatus(500);
    })
})

//check if exists
router.get("/port/:port/hosts",(req,res)=>{
    var port=req.params.port;
    //nqdb.any(`select host_full_name, upper(host_mac) as \"mac\",admin_cf as \"cf\" from vw_network_status_ex_3 where pp_port_code='${port}' and host_mac is not null`).then(data=>{
        //query=`select host_full_name, upper(host_mac) as "mac",admin_cf as "cf",sw_port_vlanid as "vlanid", admin_is_authorized as "userIsAuth" from vw_network_status_ex_3 where pp_port_code='${port}' and host_mac is not null`
    query=`select host_full_name, upper(host_mac) as "mac",admin_cf as "cf",sw_port_vlanid as "vlanid", admin_is_authorized as "userIsAuth" from vw_network_status_ex_3 where pp_port_code='${port}'`
    
    nqdb.any(query).then(data=>{
        res.status(200).json(data);
    }).catch(err=>{
        console.log(err)
        res.sendStatus(500);
    })
})

router.get("/portcode/:pc/vlan",(req,res)=>{
    
    //nqdb.any("select alias as txt,port_code as value from pp_port where loc_id=$1 order by alias",[req.params.locid])
    nqdb.any('select sw_port_vlanid as vlanid from vw_network_status_ex_3 where pp_port_code=$1 LIMIT 1',[req.params.pc]
            )
            .then(function(data) {
                // success;
                res.status(200).json(data[0]);
            })
            .catch(function(error) {
                console.log(error);
            });
    
});

module.exports = router;