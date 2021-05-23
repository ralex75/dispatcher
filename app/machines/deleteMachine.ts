import {MachineState} from './machine'
import {DeleteMachineStatus,BasicMachineStatus,MachineStatusType,CustomError,deleteMachineStatusDescription} from './machineTypes'
import {network} from '../helpers'



export class DeleteMachineState extends MachineState{
    
    constructor(data:any,dumpFilePath:string){
        super(data,dumpFilePath)
    }
 
    get machineStatus()
    {
        return {...DeleteMachineStatus,...BasicMachineStatus}
    }

    get statusDescription(){
        return deleteMachineStatusDescription;
    }

    async nextState(){

       let ms=this.machineStatus;
       let {data} = this.data;
       let {from,to}=data;
       
       try{

            switch(this.state)
            {
                case ms.START:
                    {
                        if(!from || to!=null){
                            throw new CustomError("La macchina gestisce solo la rimozione di un nodo")
                        }
                        
                        this.changeState(ms.CHECK_SOURCE_PORT)
                    }
                break;
                case ms.CHECK_SOURCE_PORT:
                    {
                        let port=from.port;
                        let mac=from.mac;

                        this.writeLog(`\nquerying port ${port} from DB...`)
                        let swp:any = await network.getSwitchPortByPortCode(port);
                        this.writeLog(`done.`)
                
                        if(!swp) 
                        {   
                            throw new CustomError("Porta switch di destinazione non collegata")
                        }
                  
                        //recupera i mac dei nodi connessi alla porta
                        let toLinkedHosts:any=await network.getPortLinkedHosts(port);
                        console.log("toLinkedHosts:",toLinkedHosts)
                        
                        toLinkedHosts=toLinkedHosts.filter((m:any)=>m.host_mac.toLowerCase()!=mac.toLowerCase());
                        if(toLinkedHosts.length==0)
                        {
                            this.writeLog(`\nno other hosts connected to port.`)
                            this.changeState(ms.DISABLE_SOURCE_PORT,{"swp":swp})
                        }
                        else{
                            this.writeLog(`\nthere are other hosts connected to port.`)
                            this.changeState(ms.HOST_DELETE)
                        }
                        
                    }
                break;
                case ms.DISABLE_SOURCE_PORT:
                    {
                    
                        let {swp} = this.stateData;
                        let {sw_name,sw_port_no}=swp;
                        swp.sw_port_enabled=false;
                        swp.sw_port_security=false;
                        this.writeLog(`\ndisabling switch port ${sw_name}#${sw_port_no}....`)
                        try{
                            await network.saveSwitchPort(swp);
                            this.writeLog(`done.`)
                        }
                        catch(exc)
                        {
                            this.writeLog(`failed.`)
                            throw exc;
                        }
                        try{
                            this.writeLog(`\nsync switch port ${sw_name}#${sw_port_no} by snmp...`)
                             //await network.syncSwitchPort(sw_name,sw_port_no);
                            this.writeLog(`done.`)
                        }
                        catch(exc)
                        {
                            this.writeLog(`failed.`)
                            throw exc;
                        }
                      
                        this.changeState(ms.HOST_DELETE);
                    }
                break;
                case ms.HOST_DELETE:
                    {

                        try{
                            this.writeLog(`\nRimozione informazioni del nodo ${from.mac}...`)
                            await network.deleteHost(from.mac);
                            this.writeLog(`done.`)
                        }
                        catch(exc)
                        {
                            throw new CustomError("Rimozione dati del nodo non riuscito:"+exc);
                        }

                        if(from.config=='DHCP')
                        {
                            try
                            {
                                
                                this.writeLog(`\nsincronizzazione nodi DHCP...`)
                                let results={"status":200,"data":"sync success"}
                                this.writeLog(`done.`)
                                
                                
                                //results.host_handle.success=(res.status==200 && res.data.toLowerCase()=="sync success");
                                if(results.data.toLowerCase()!="sync success")
                                {
                                    throw Error("DHCP non sincronizzato. Verificare lo stato del DHCP server.")
                                }
              
                            }
                            catch(exc)
                            {
                                throw new CustomError(exc)
                            }

                        }

                        this.changeState(ms.END)
                    }
                break;
                
                case ms.ERROR:
                
                    let newState:MachineStatusType;

                    let {state,exc}=this.stateData;
                    
                    let excMessage=exc.message || exc;

                    this.writeStatusResult(state,excMessage);
                    this.writeLog(`\n${excMessage}`)
                    
                    let isExternalException=exc.name!='CustomError'

                    console.log(`Error: ${excMessage}`)

                    switch(state)
                    {
                        case ms.CHECK_SOURCE_PORT:
                            if(isExternalException)
                            {
                                newState=ms.END;
                            }
                            else
                                newState=ms.HOST_DELETE;
                        break;
                        case ms.DISABLE_SOURCE_PORT:
                            newState=ms.HOST_DELETE;
                        break;
                        case ms.HOST_DELETE:
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