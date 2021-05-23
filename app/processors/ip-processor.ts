import {IPReport} from '../reports/ip.repo'
import {ProcessRequest} from './processor'
import {iProcessResult,ProcessResultOK,ProcessResultBAD} from './process-result'

import {BasicMachineStatus} from '../machines/machineTypes'
import {MachineState} from '../machines/machine'
import {CreateMachineState} from '../machines/createmachine'
import {UpdateMachineStateDHCP} from '../machines/updateMachineDHCP'
import {UpdateMachineStateStatic} from '../machines/updateMachineStatic'
import {DeleteMachineState} from '../machines/deleteMachine'


class IP_Processor extends ProcessRequest 
{
        
    constructor(id:number,user:any,data:any)
    {
        super(id,user,data)
    }

    isValidData(data:any)
    {
        
        //Check data
        return true;
    }

    async exec(){

        console.log("Exec processor IP")

        let user=this.user;
        let data=this.data;
        let rid=this.id;
        let {from,to,action}=data;
        let machine:any=null;
        let processResult:any;
        let dumpFilePath=`./${__dirname}/logs/machine_${new Date().toLocaleDateString().replace(/\//g,"_")}_${rid}_dump.txt`
            
        console.log(new Date().toLocaleDateString())
                      
        switch(action)
        {
            case 'create':
                machine=CreateMachineState;
            break;
            case 'update':
                if(to.config=='DHCP')
                {
                    machine=UpdateMachineStateDHCP
                }
                else
                    machine=UpdateMachineStateStatic
            break;
            case 'delete':
                machine=DeleteMachineState
            break;
            default:
                machine=MachineState;
        }

        
                        
        try{
            
            machine=new machine({data,user,rid},dumpFilePath)
            console.log(machine.constructor.name)

            while(machine.state!=BasicMachineStatus.EXIT)
            {
                await machine.nextState()
            }

            processResult=ProcessResultOK
        }
        catch(exc){

            console.log("Catch by outer:",exc)
            processResult=ProcessResultBAD

        }

        
        let logs=(machine as MachineState).logs
          
        //console.log("Report:",JSON.stringify(logs))
               
        return new IPReport(user,data,new processResult(logs));
    
    }

      
}

export {IP_Processor}