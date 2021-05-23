import {Report} from './report'
import {helpers} from '../helpers'
import { formatWithOptions } from 'util';


class IPReport extends Report{
    
    getTemplateFileName():string{
        return "ip.txt";
    }

    async mapBasicData(user:any,data:any):Promise<any>{

        var {from,to,action} = data;
        var h= to || from;
        var hostname = h.name ? h.name+"."+h.domain : "DHCP : "+h.mac;
        const HOST_ACTION_MAP:any={ "ITA":{"create":"Nuovo nodo","update":"Aggiornamento dati del nodo","delete":"Rimozione nodo"},
                                    "ENG":{"create":"New host","update":"Update host data","delete":"Delete host"}
                                  };

        const HOST_CONFIG_MAP:any={"STATIC":"STATICO","DHCP":"DHCP","STATICVM":"STATICO - VIRTUALE"}

        let loc:any=await helpers.getPortLocation(h.port);
      
        if(!loc)
        {
            throw new Error(`No location found by port: ${h.port}`)
        }

        if(action=='update'){
            hostname = from.name ? from.name+"."+from.domain : "DHCP  "+from.mac;
        }

      
        var map:any={
                    "ACTION_ITA":`${HOST_ACTION_MAP.ITA[action]} - ${hostname}`,
                    "ACTION_ENG":`${HOST_ACTION_MAP.ENG[action]} - ${hostname}`,
                    "NAME":user.name,
                    "SURNAME":user.surname,
                    "EMAIL":user.email,
                    "PHONE":user.phone || '---',
                    "H_MAC":h.mac.toUpperCase(),
                    "NOTE":h.notes || "---",
                    "H_NAME": this.toHostName(h.name,h.domain),
                    "CONFIG": HOST_CONFIG_MAP[h.config], 
                    "BUILD":loc.build,
                    "FLOOR":loc.floor,
                    "ROOM":loc.room,
                    "PORT":loc.port_code,
                }
        
        if(action=='update' && from)
        {
            loc=await helpers.getPortLocation(from.port);

            map["H_MAC"]=this.displayChanges(from.mac,map["H_MAC"]),
            map["H_NAME"]=this.displayChanges(this.toHostName(from.name,from.domain),map["H_NAME"]),
            map["CONFIG"]=this.displayChanges(HOST_CONFIG_MAP[from.config],map["CONFIG"]), 
            map["BUILD"]=this.displayChanges(loc.build,map["BUILD"]),
            map["FLOOR"]=this.displayChanges(loc.floor,map["FLOOR"]),
            map["ROOM"]=this.displayChanges(loc.room,map["ROOM"]),
            map["PORT"]=this.displayChanges(loc.port_code,map["PORT"])
       
        }

       //usiamo per IP SUBJ= ACTION_ITA         
       map["SUBJ"]=map["ACTION_ITA"]
                              
       return map;

       
  
    }

    toHostName=(name:string,domain:string)=>{
        return name ? `${name}.${domain}`: "DHCP"
    }


    displayChanges(from:string,to:string):string
    {
        from=from || ""
        to= to || ""
        from=from.toString()
        to=to.toString();

        return from.toLowerCase()==to.toLowerCase() ? to.toUpperCase() : `${from.toUpperCase()} ==> <b>${to.toUpperCase()}</b>`
    }


    async mapAdvancedData(user:any,data:any):Promise<any>{

        var txt:string="";
        var {from,to,action} = data;
        var h= to || from;
        var map:any=await this.mapBasicData(user,data);
        var network="N/A";

        map["USE_MAC_BUSY"]=""
        
        if(to && to["useMacBusy"])
        {
            map["USE_MAC_BUSY"]=`Attenzione, l'utente ha confermato l'intenzione di voler gestire il nodo con mac address ${to["mac"].toUpperCase()} che risulta già registrato.`
        }

        /*
        if(h.config!="DHCP")
        {
            var net:any=await helpers.getPortNetwork(h.port);
            network = net ? net.network: "N/A";
         }
        else{
            network = "141.108.13.0/24";
        }
        */

        /* NON INSERIRE ---> MOSTRARE LE VLAN SUGGERITE DEL PIANO TODO
        txt="=====================  dati aggiuntivi  ====================<br>"
        txt+=helpers.addEmptySpacesToEnd(18,"Network suggerita")+ " = "+ network;
        */
        

        if (this.processResult)
        {
            txt+="=====================  Esito esecuzione automatica  ====================<br>"
            txt+= JSON.stringify(this.processResult.getValue());
        }

        map["PROCESS_RESULT"]=txt;
       
                              
       return map;
  
    }
}

export {IPReport}