import {Report} from './report'
import {helpers} from '../helpers'

class IPReport extends Report{
    
    getTemplateFileName():string{
        return "ip.txt";
    }

    

    async mapBasicData(user:any,data:any):Promise<any>{

        let {from,to,action} = data;
        let h= to || from;
        let hostname = this.toHostName(h.config,h.name,h.domain,h.mac);
        const HOST_ACTION_MAP:any={ 
                                    "ITA":{"create":"Nuovo nodo","update":"Aggiornamento dati del nodo","delete":"Rimozione nodo"},
                                    "ENG":{"create":"New host","update":"Update host data","delete":"Delete host"}
                                  };

        const HOST_CONFIG_MAP:any={"STATIC":"STATICO","DHCP":"DHCP","STATICVM":"STATICO - VIRTUALE"}


        if(action=='update'){
            hostname = this.toHostName(from.config,from.name,from.domain,from.mac)
            //hostname = from.config !='DHCP' ? `${from.name}.${from.domain}`: `DHCP ${from.mac}`
            //hostname = from.name ? from.name+"."+from.domain : "DHCP  "+from.mac;
        }

        

       

        //check valid input data
        let loc:any=await helpers.getPortLocation(h.port);
        let macExists=await helpers.getHost(h.mac)
        let nameExists= (to && to.name) ? await helpers.dnsLookup(`${to.name}.${to.domain}`) : false;


        if(action!='delete'){
            
            let msg=[`Request IP - ${action} - errors:`]
            
            if(macExists){
                if(from && from.mac==to.mac){ macExists=false}
                else
                    msg.push(`duplicated mac ${h.mac}`)
            }
            
            if(nameExists){
                if(from && from.name==to.name && from.domain==to.domain){ nameExists=false}
                else
                    msg.push(`duplicated name ${to.name}.${to.domain}`)
            }


            if(macExists || nameExists)
            {
                throw new Error(msg.join(" "))
            }
        }

        if(!loc)
        {
            throw new Error(`No location found by port: ${h.port}`)
        }

        //map data
        var map:any={
                    "ACTION_ITA":`${HOST_ACTION_MAP.ITA[action]} - ${hostname}`,
                    "ACTION_ENG":`${HOST_ACTION_MAP.ENG[action]} - ${hostname}`,
                    "NAME":user.name,
                    "SURNAME":user.surname,
                    "EMAIL":user.email,
                    "PHONE":user.phone || '---',
                    "H_MAC":h.mac.toUpperCase(),
                    "NOTE":h.notes || "---",
                    "H_NAME": this.toHostName(h.config,h.name,h.domain),
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
            map["H_NAME"]=this.displayChanges(this.toHostName(from.config,from.name,from.domain),map["H_NAME"]),
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

    toHostName=(config:string,name:string,domain:string,mac:string="")=>{
        return config!='DHCP' ? `${name}.${domain}`: mac ? "DHCP "+mac : "DHCP"
    }


    displayChanges(from:string,to:string):string
    {
        from=from ?? ""
        to= to ?? ""
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