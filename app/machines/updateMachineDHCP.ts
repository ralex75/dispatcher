import {MachineState} from './machine'
import {UpdateMachineStatus,BasicMachineStatus,MachineStatusType,CustomError,updateMachineStatusDescription} from './machineTypes'
import {network} from '../helpers'



export class UpdateMachineStateDHCP extends MachineState{
    
    constructor(data:any,dumpFilePath:string){
        super(data,dumpFilePath)
    }
 
    get machineStatus()
    {
        return {...UpdateMachineStatus,...BasicMachineStatus}
    }

    get statusDescription(){
        return updateMachineStatusDescription;
    }

    async nextState(){

       let ms=this.machineStatus;
       let newState:MachineStatusType;
       let {data,user} = this.data;
       let {from,to}=data;
       
       try{

            switch(this.state)
            {
                case ms.START:
                    {
                        if(!to || to.config!='DHCP' || !from){
                            throw new CustomError("La macchina gestisce solo l'aggiornamento nodo in DHCP")
                        }
                        
                        this.changeState(ms.CHECK_DEST_PORT)
                    }
                break;
                case ms.CHECK_DEST_PORT:
                    {
                        
                        this.writeLog(`\nquerying port ${to.port} from DB...`)
                        let swp:any = await network.getSwitchPortByPortCode(to.port);
                        this.writeLog(`done.`)
                
                        if(!swp) 
                        {   
                            throw new CustomError("Porta switch di destinazione non collegata")
                        }
                
                        let mac=(from || to).mac  

                        //recupera i mac dei nodi connessi alla porta
                        let toLinkedHosts:any=await network.getPortLinkedHosts(to.port);
                        toLinkedHosts=toLinkedHosts.filter((m:any)=>m.host_mac.toLowerCase()!=mac.toLowerCase());
                
                        let {sw_name,sw_port_no}=swp;
                
                        
                        this.writeLog(`\nquerying switchport ${sw_name}#${sw_port_no} by snmp...`)
                        let {data:swpi}=await network.getSwPortInfoBySNMP(sw_name,sw_port_no);
                        this.writeLog(`done.`)
                
                        //controllo per evitare che una porta non DHCP con NODI diventi DHCP
                        if(swpi.vlanid!=113 && toLinkedHosts.length>0)
                        {
                            throw new CustomError("La porta di destinazione con VLAN NON DHCP non risulta libera, ci sono nodi registrati.")
                        }
                        
                        this.changeState(ms.SWP_TO_DHCP,{"swp":swp,"swpi":swpi});
                    }
                break;
                case ms.SWP_TO_DHCP:
                    
                    {
                  
                        let {swp,swpi} = this.stateData;
                        let {sw_name,sw_port_no}=swp
                        swp.sw_port_enabled  = true;
                        swp.sw_port_security = false;
                        swp.sw_port_vlanid = 113
                        
                        this.writeLog(`\nsaving switch port ${sw_name}#${sw_port_no} to DHCP ...`)
                        await network.saveSwitchPort(swp);
                        this.writeLog(`done.`)

                        //sincronizza la porta se non è DHCP o non è abilitata
                        if(swpi.vlanid!=113 || !swpi.enabled)
                        {
                            this.writeLog(`\nsync switch port ${sw_name}#${sw_port_no} by snmp...`)
                            await network.syncSwitchPort(sw_name,sw_port_no);
                            this.writeLog(`done.`)
                        }

                        this.changeState(ms.HOST_SAVE)
                    }

                break;
                case ms.HOST_SAVE:
                    {
                        try{
                            this.writeLog(`\nInserimento informazioni del nuovo nodo ${to.mac}...`)
                            await network.saveHost(from?.mac,to,user);
                            this.writeLog(`done.`)
                        }
                        catch(exc)
                        {
                            throw new CustomError("Salvataggio dati del nodo non riuscito:"+exc);
                        }

                        try
                        {
                            this.writeLog(`\nsync DHCP server...`)
                            //let res=await network.syncDHCPHosts();
                            let results={"status":200,"data":"sync success"}
                            //results.host_handle.success=(res.status==200 && res.data.toLowerCase()=="sync success");
                            if(results.data.toLowerCase()!="sync success")
                            {
                                this.writeLog(`failed.`)
                                throw Error("DHCP non sincronizzato. Verificare lo stato del DHCP server.")
                            }

                            this.writeLog(`done.`)

                            this.changeState(ms.CHECK_SOURCE_PORT);
                        }
                        catch(exc)
                        {
                            throw new CustomError("DHCP non sincronizzato. Verificare lo stato del DHCP server."+exc)
                        }
                       
                    }
                break;
                case ms.CHECK_SOURCE_PORT:
                    {
                        if(from && from.port!=to.port)
                        {
                            let swp:any = await network.getSwitchPortByPortCode(from.port);
                            let toLinkedHosts:any=await network.getPortLinkedHosts(from.port);
                            if(swp.sw_port_vlanid!=113 && toLinkedHosts.length==0)
                            {
                                this.changeState(ms.DISABLE_SOURCE_PORT,{'swp':swp})
                            }
                            else{
                                this.changeState(ms.END)
                            }
                        }
                        else{
                            this.changeState(ms.END)
                        }
                    }
                    break;
                case ms.DISABLE_SOURCE_PORT:
                    
                    {
                        let {swp}=this.stateData;
                        let {sw_name,sw_port_no}=swp;
                        this.writeLog(`\ndisabling switch port ${sw_name}#${sw_port_no}....`)
                        swp.sw_port_enabled=false;
                        swp.sw_port_security=false;
                        await network.saveSwitchPort(swp);
                        this.writeLog(`done.`)
                        this.writeLog(`\nsync switch port ${sw_name}#${sw_port_no} by snmp...`)
                        //await network.syncSwitchPort(sw_name,sw_port_no);
                        this.writeLog(`done.`)
                        this.changeState(ms.END);
                    }

                    break;
                case ms.ERROR:
                    
                    let {state,exc}=this.stateData;
                    
                    let excMessage=exc.message || exc;

                    this.writeStatusResult(state,excMessage);
                    
                    let isExternalException=exc.name!='CustomError'
                
                    switch(state)
                    {
                        case ms.CHECK_DEST_PORT:
                            if(isExternalException)
                            {
                                newState=ms.END;
                            }
                            else
                                newState=ms.HOST_SAVE;
                        break;
                        case ms.SWP_TO_DHCP:
                            newState=ms.HOST_SAVE;
                        break;
                        case ms.DISABLE_SOURCE_PORT:
                            newState=ms.END;
                        break;
                        case ms.HOST_SAVE:
                            newState=ms.END;
                        break;
                        default:
                            newState=ms.END;
                        break;
                    }
              
                    this.changeState(newState);
                break;
                case ms.END:
                    MachineState.prototype.nextState.call(this)
                break;
                default:
                    this.changeState(ms.END)
            }
        }
        catch(exc)
        {
            //console.log("CATCH ERROR CREATE MACHINE")
            this.changeState(ms.ERROR,{state:this.state,exc:exc})
        }

    }
     
}