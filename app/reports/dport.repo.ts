import {Report} from './report'
import {helpers} from '../helpers'
const {generateHtmlWhiteSpace} = require ('../api/templates.js')

class EnaDPortReport extends Report{
    
    getTemplateFileName():string{
        return "dport.txt";
    }

    async mapBasicData(user:any,data:any):Promise<any>{

        let {port,port_alias} = data;
            
        //check valid input data
        let loc:any=await helpers.getPortLocation(port);
        let hosts:any=await helpers.getUserDHCPHosts(user.uuid);
       
        if(!loc) throw new Error(`No location found by port: ${port}`)
        if(!hosts || hosts.length==0) throw new Error(`No user dhcp hosts!!!`)
       
        let p=loc.port_code!=loc.port_alias ? loc.port_alias : loc.port_code

        //map data
        var map:any={
                    "SUBJ":`Attivazione presa di rete ${p}`,
                    "SUBJ_ITA":`Attivazione presa di rete ${p} in modalità DHCP`,
                    "SUBJ_ENG":`Enabling network port ${p} in DHCP mode`,
                    "NAME":user.name,
                    "SURNAME":user.surname,
                    "EMAIL":user.email,
                    "PHONE":user.phone || '---',
                    "H_MAC_LIST":hosts.map((h:any)=>h.host_mac).join(`\n ${generateHtmlWhiteSpace(3)}`),
                    "BUILD":loc.build,
                    "FLOOR":loc.floor,
                    "ROOM":loc.room,
                    "PORT":loc.port_code,
                }
    
        
                             
       return map;

                
    }


    async mapAdvancedData(user:any,data:any):Promise<any>{

        var txt:string="";
        var map:any=await this.mapBasicData(user,data);

                      
        if (this.processResult)
        {
            txt+="=====================  Esito esecuzione automatica  ====================<br>"
            txt+= JSON.stringify(this.processResult.getValue());
        }

        map["PROCESS_RESULT"]=txt;
       
                              
       return map;
  
    }
}

export {EnaDPortReport}