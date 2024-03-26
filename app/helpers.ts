const {nqdb:db}=require('../api/db')
const {sendMail}=require('../api/mailer')
import { Moment } from 'moment';

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

    getHost:function(mac:string){
        return new Promise((resolve)=>{ 
            let host_mac=mac.toLowerCase();
            db.any(`select loc_id ,loc_building as "build",loc_floor as "floor",loc_name, host_name,host_domain,host_mac,pp_port_code from vw_network_status_ex_3 where lower(host_mac::text)=lower($1)`,[host_mac])
            .then(function(res:any){
                 resolve(res[0] || null);
            })
        })
    },

    //nodi appartenenti utente
    getUserDHCPHosts:function(uuid:string){
        return new Promise((resolve)=>{ 
            db.any(`select host_mac from vw_network_status_ex_3 where lower(admin_cf::text)=lower($1) and host_is_dhcp is true`,[uuid])
            .then(function(res:any){
                 resolve(res);
            })
        })
    },

    dnsLookup:function(name:string){
            
        const dns = require("dns");
        return new Promise((res,rej)=>{
            dns.resolve(name,(err:any,addr:any)=>{
                
                if(err)
                {
                    console.log(err)
                    let ecode=err.errno || err.code
                    if(ecode!='ENOTFOUND')
                    {
                        rej(err);
                    }
                    
                }
                res(addr || null);
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

    setDispatchResult:function(rid:any, notific:Moment|null, process:Moment|null, error:string|null){
        var status= !error ? "PROCESSED" : "BAD";
        db.query("update user_requests set notific_date=$1,process_date=$2,logs=$3,status=$5 where id=$4",[notific,process,error,rid,status])
        .then( (resp:any) =>{
        }).catch( (err:any) => {
            console.log("An error has occurred:")
            throw (err)
        })
    },

    sendReport:function(from:string, to:string, subj:string, report:string)
    {
        return sendMail(from, to, subj,`<pre>${report}</pre>`);
    }

}

export {helpers}