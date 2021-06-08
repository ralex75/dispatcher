var express = require('express');
var router = express.Router();
var {nqdb:db}=require("./db");
//var helper=require("./helper.js");


//rid: request ID
router.get("/:rid",(req,res)=>{
    
    db.one("select * from user_requests where id=$1",req.params.rid)
    .then(data=>{
        res.json(data);
    }).catch(err=>{
        res.status(500).json({"err":err})
    })
})


//lista richieste 
//userid implicito 
router.post('/list',(req,res)=>{
    
    var uid=req.userid;
    var type=req.body.type;
    var query=`select id, req_date, conf_date, notific_date, process_date, exc, rtype, data from user_requests`;
    var params={};

    //console.log("req:",req.userid);

    if(uid || type)
    {
        
       
        var idx=0;
        
        if (uid)
        {
          params[`uid=$${++idx}`]=uid;
          
        }
        
        if (type)
        {
           params[`rtype=$${++idx}`]=type;
        }

        query+=" WHERE "+Object.keys(params).join(" and ")

        
    }

    
    
    query+=" order by id desc limit 20";

    //console.log("query:",query);

    db.query(query,Object.values(params)).then(data=>{
        res.json(data);
       
    }).catch(err=>{
        res.status(500).json({"err":err})
    })
});



router.post('/save', (req,res)=>{
    
    const moment = require('moment');

    const {type,data}=req.body;
    const uid=req.userid;
  
    const now=moment().format('YYYY-MM-DD:HH:mm:ss');
    
    db.one("insert into user_requests (uid, req_date, data, rtype,status) VALUES($1,$2,$3,$4,'SUBMITTED') RETURNING id",[uid,now,data,type])
    .then(data => {
        // success, COMMIT was executed

        res.json(data);
    })
    .catch(error => {
        console.log(error);
        res.status(500).json(error);
    
    });
  
})

const getFirst=async (userid)=>
{
    return await db.any("select req_date from user_requests where uid=$1 order by req_date ASC limit 1",[userid]);
}

module.exports={router,getFirst};