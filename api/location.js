var express = require('express');
var router = express.Router();
var {nqdb}=require("./db");

//get floors
router.get("/:build/floors",(req,res)=>{
    
    nqdb.any("select floor as value, \
            case \
            when floor ='-1' THEN 'Seminterrato'\
            when floor ='0' THEN 'Piano terra'\
            when floor ='1' THEN 'Primo piano'\
                when floor ='2' THEN 'Secondo piano'\
                when floor ='3' THEN 'Terzo piano'\
                when floor ='4' THEN 'Quarto piano'\
                when floor ='5' THEN 'Quinto piano'\
                when floor ='6' THEN 'Sesto piano'\
                ELSE 'other'\
            end as txt\
            from (select distinct(floor) from location where building=$1) x\
            order by floor",[req.params.build.toUpperCase()])
    .then(function(data) {
        // success;
        res.status(200).json(data);
    })
    .catch(function(error) {
        console.log(error);
    });
    
});

//get rooms
router.get("/:build/floors/:floor/rooms",(req,res)=>{
    
    nqdb.any("select loc_id as value, name as txt from location where building=$1 and floor=$2 \
            order by name",[req.params.build.toUpperCase(),req.params.floor])
    .then(function(data) {
        // success;
        res.status(200).json(data);
    })
    .catch(function(error) {
        console.log(error);
    });
    
});

//get ports
router.get("/rooms/:locid/ports",(req,res)=>{
    
    //nqdb.any("select alias as txt,port_code as value from pp_port where loc_id=$1 order by alias",[req.params.locid])
    /*nqdb.any('select x.*, CASE WHEN (hosts>0 AND authorized>0) THEN true ELSE false END as "busy" from \
                ( \
                select loc_id,pp_port_code as \"port_code\",pp_port_alias as \"port_alias\",max(sw_port_vlanid) as \"vlanid\", count(host_mac) as \"hosts\", max(admin_is_authorized::integer) as \"authorized\" from vw_network_status_ex_3 where loc_id=$1\
                group by loc_id,pp_port_code,pp_port_alias\
                ) x order by port_code',[req.params.locid] 
            )
            .then(function(data) {
                // success;
                res.status(200).json(data);
            })
            .catch(function(error) {
                console.log(error);
            });*/

    //solo i nodi per porta che non sono VM. I nodi VM di fatto sono sulla stessa macchina che li ospita quindi irrilevanti per occupazione
    nqdb.any('select *, ARRAY(select host_mac from vw_network_status_ex_3 where pp_port_code=x.port_code and admin_is_authorized and host_is_vm is false) as "auth_hosts" \
            from ( \
            select loc_id,pp_port_code as \"port_code\", pp_port_alias \
            as \"port_alias\",pp_port_broken as "broken", max(sw_port_vlanid) as \"vlanid\" \
            from vw_network_status_ex_3 where loc_id=$1 \
            group by loc_id,pp_port_code,pp_port_alias,pp_port_broken \
            )x order by port_code',[req.params.locid]) .then(function(data) {
                // success;
                res.status(200).json(data);
            })
            .catch(function(error) {
                console.log(error);
            });

            
    
});

router.get("/byport/:pc",(req,res)=>{
    
    //nqdb.any("select alias as txt,port_code as value from pp_port where loc_id=$1 order by alias",[req.params.locid])
    nqdb.any('select loc_id ,loc_building as "build",loc_floor as "floor",loc_name from vw_network_status_ex_3 where pp_port_code=$1 limit 1',[req.params.pc]
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
