import {MachineState} from './machine'
import {UpdateMachineStatus,BasicMachineStatus,MachineStatusType,CustomError,updateMachineStatusDescription} from './machineTypes'
import {network} from '../helpers'



export class UpdateMachineStateStatic extends MachineState{
    
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
                        if(!from)
                        {
                            throw new CustomError("Creazione nodo statico non gestista.")
                        }

                        //deve cambiare solo il macaddress per poter gestire in automatico le modifiche ad un nodo statico
                        let changedKeys:string[]=[]
                        Object.keys(to).forEach(k=>{
                            if(from[k] && from[k]!=to[k] && k!='notes' && k!='config')
                            {
                                changedKeys.push(k)
                            }
                        })

                        if(changedKeys.length==1 && changedKeys[0]=='mac')
                        {
                            this.changeState(ms.HOST_SAVE);
                        }
                        else{
                            
                            throw new CustomError("Aggiornamento nodo statico non gestito.")
                            
                        }
                    }

                break;
               
                case ms.HOST_SAVE:
                    {

                        try{

                            this.writeLog(`\nAggiornamento informazioni del nodo ${to.mac}...`)
                            await network.updateMacHost(from.mac,to.mac);
                            this.writeLog("done.")
                        }
                        catch(exc)
                        {
                            throw new CustomError("Salvataggio dati del nodo non riuscito:"+exc);
                        }

                        this.changeState(ms.SWP_SYNC)

                    }
                break;
                case ms.SWP_SYNC:
                    {
                        let swp:any = await network.getSwitchPortByPortCode(to.port);
                        let {sw_name,sw_port_no}=swp;
                        swp.sw_port_security=true;
                        
                        this.writeLog(`\nenablig security on switch port ${sw_name}#${sw_port_no}`)
                        await network.saveSwitchPort(swp);
                        await network.syncSwitchPort(sw_name,sw_port_no);
                        this.writeLog("done.")
                        this.changeState(ms.END)
                    }
                    break;
                case ms.ERROR:
                    
                    let {state,exc}=this.stateData;
                    
                    let excMessage=exc.message || exc;

                    this.writeStatusResult(state,excMessage);
                    this.writeLog("\n"+excMessage)
                    
                    let isExternalException=exc.name!='CustomError'

                    console.log(`Error: ${excMessage}`)

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
                        case ms.HOST_SAVE:
                            newState=ms.END;
                        break;
                        case ms.SWP_SYNC:
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
            this.changeState(ms.ERROR,{state:this.state,exc:exc})
        }
    }
 
}