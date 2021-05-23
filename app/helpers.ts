const {nqdb:db}=require('../api/db')
const {sendMail}=require('../api/mailer')
import { Moment } from 'moment';
import moment from 'moment';
const axios = require('axios');


const baseURL='http://localhost:5000'

interface iSwitchPort{
    //swp.enabled,swp.vlanid,swp.notes,swp.broken,swp.security,
    switch:string,
    port_no:number,
    enabled:boolean,
    vlanid:number,
    broken:boolean,
    security:boolean,
    notes:string
}

var network={

   
    
    getPortLinkedHosts:function(port_code:string){
        return new Promise((resolve)=>{
           db.any('select host_mac from vw_network_status_ex_3 \
                    where pp_port_code =$1 and host_mac is not null',[port_code])
            .then(function(data:any){
                resolve(data || []);
            })
        })
    },

    getNCCode:function(port:string)
    {
        let p=port.split("-")
        return [p[1],p[3]]
    },

    getHost:async function(mac:string)
    {
        return await db.oneOrNone("select from host where mac=$1",[mac]);
    },

    deleteHost:async function(mac:string)
    {
        return await db.none("DELETE from host where mac=$1",[mac]);
    },

    updateMacHost:function(fmac:string,tmac:string)
    {
        return new Promise((resolve,reject)=>{
            db.tx(async (t:any) => {
                await t.none('UPDATE host set mac=$1 where mac=$2', [tmac,fmac])
            })
            .then((data:any) => {
                // success, COMMIT was executed
                //console.log("Salvataggio Nodo - DONE")
                resolve("Aggiornamento Mac address nodo - DONE")
            })
            .catch((error:any) => {
                // failure, ROLLBACK was executed
                //console.log("Salvataggio Nodo - Failed:",error)
                reject("Aggiornamento Mac address nodo - Failed:"+error)
            });
        })
    },

    saveHost:function(fmac:string,to:any,user:any)
    {
              
        let now=moment().format("YYYY-MM-DD");
        let {name=null,domain=null,ip=null,mac,port}=to;
        let pc=this.getNCCode(port)
        
       
       
        return new Promise((resolve,reject)=>{
        
          db.tx(async (t:any) => {

            if(fmac)
            {
                
                await t.none('DELETE from host_port_link where mac = $1', [fmac])
                await t.none('DELETE from host where mac = $1',[fmac])
                
            }

            await t.none('DELETE from host where mac = $1',[mac])

            
            let p= await db.oneOrNone("select * from person where cf=$1",[user.uuid])
            if(!p)
            {
                await t.one('INSERT into person (cf,first_name,last_name,email,phone,source,authorized,infn_uuid) values($1,$2,$3,$4,$5,$6,$7,$8) returning cf', [user.uuid,user.name,user.surname,user.email,user.phone,"LDAP",true,user.uuid])
            }
            //await t.one('INSERT into host (mac,dhcp,req_date,appr_date,admin) values($1,$2,$3,$4,$5) returning mac', [mac,true,now,now,user.uuid])
            let isDHCP=!ip;
            await t.one('INSERT into host (name,domain,mac,ip,dhcp,req_date,appr_date,admin) values($1,$2,$3,$4,$5,$6,$7,$8) returning mac', [name,domain,mac,ip,isDHCP,now,now,user.uuid])
            
            await t.one('INSERT into host_port_link values($1,$2,$3) returning mac', [mac,pc[0],pc[1]])
           
        })
            .then((data:any) => {
                // success, COMMIT was executed
                //console.log("Salvataggio Nodo - DONE")
                resolve("Salvataggio Nodo - DONE")
            })
            .catch((error:any) => {
                // failure, ROLLBACK was executed
                //console.log("Salvataggio Nodo - Failed:",error)
                reject("Salvataggio Nodo - Failed:"+error)
            });
        })
    },


    syncDHCPHosts:async function(){
        return await axios.get(`${baseURL}/api/dhcpvlan/sync`)
    },

    getSwPortInfoBySNMP:async function (name:string,port:number) {
        return await axios.get(`${baseURL}/api/snmp/${name}/${port}/info`);
    },

    //ritorna la porta switch collegata alla porta pp
    getSwitchPortByPortCode:function(pc:string){
        return new Promise((resolve)=>{
           db.any('select sw_name,sw_port_no,sw_port_vlanid,sw_port_broken,sw_port_enabled,sw_port_notes from vw_network_status_ex_3 \
                    where pp_port_code =$1 LIMIT 1',[pc])
            .then(function(data:any){
                resolve(data[0] || null);
            })
        })
    },

    saveSwitchPort:async function(swp:any) {
        //console.log("swp:",swp)
        let payLoad={
            switch:swp.sw_name,
            port_no:swp.sw_port_no,
            enabled:swp.sw_port_enabled,
            vlanid:swp.sw_port_vlanid,
            broken:swp.sw_port_broken,
            security:swp.sw_port_security,
            notes:swp.sw_port_notes
        }

       // console.log("payLoad:",payLoad)

        return await axios.post(`${baseURL}/api/switch/${swp.sw_name}/ports/${swp.sw_port_no}/save`,{"swp":payLoad})
    },

    syncSwitchPort:async function(name:string,port:number){
        return await axios.post(`${baseURL}/api/switch/${name}/ports/${port}/sync`)
    }
}

var helpers={


    getPortLocation:function(port_code:string){
        return new Promise((resolve)=>{
           db.any('select loc_id ,loc_building as "build",loc_floor as "floor",\
            loc_name as "room", pp_port_code as "port_code", pp_port_alias as "port_alias" from vw_network_status_ex_3 where pp_port_code=$1 or pp_port_alias=$1 limit 1',[port_code])
            .then(function(res:any){
                resolve(res[0] || null);
            })
        })
    },

    getPortNetwork:function(port_code:string){
        return new Promise((resolve)=>{
            var nc_code=(port_code.split("-")[1]);

            db.any('select network from network_closet nc, vlan_network vn \
                    where nc.nc_code=$1 and nc.vlan=vn.vlan',[nc_code])
             .then(function(res:any){
                 resolve(res[0] || null);
             })

         })
    },

    addEmptySpacesToEnd:function(spaces:number,value:string)
    {
        var rep= spaces-value.length;
        rep = rep < 0 ? 0 : rep;
        return value+" ".repeat(rep);
    },


    READ_ALL_REQUESTS:function()
    {
        return db.query("select * from user_requests where status ='SUBMITTED'");
    },

    setDispatchResult:function(rid:any, notific:Moment|null, process:Moment|null, error:string|null, curStatus:string='PROCESSED'){
        let status= !error ? curStatus: "BAD";
        db.query("update user_requests set notific_date=$1,process_date=$2,exc=$3,status=$5 where id=$4",[notific,process,error,rid,status])
        .then( (resp:any) =>{
        }).catch( (err:any) => {
            console.log("An error has occurred:")
            throw (err)
        })
    },

    sendReport:function(from:string, to:string, subj:string, report:string)
    {
        sendMail(from, to, subj,`<pre>${report}</pre>`);
    }



}

export {helpers,network,iSwitchPort}