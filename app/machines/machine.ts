
import {MachineStatusType,BasicMachineStatus, commonMachineStatusDescription} from './machineTypes'
import fs from 'fs';


export class MachineState{

    private _data:any;
    private _stateData:any;
    private _state:MachineStatusType;
    protected _logs:{[x:string]:{}}={};
    private _path:string;
   
    constructor(data:any,dumpFilePath:string){
        this._data=data
        this._state=this.machineStatus.START;
        this._path=dumpFilePath;

        console.log(this._path)

        this.writeLog("\n================================================================================")
        this.writeLog(`\nCreated processing machine ${this.constructor.name} for request ID:${data.rid}`)
        this.writeLog("\n================================================================================")
               
    }


    get state(){
        return this._state
    }

    get logs(){
        return this._logs;
    }

    get data(){
        return this._data;
    }

    get stateData(){
        return this._stateData;
    }
    
    get machineStatus()
    {
        return {...BasicMachineStatus}
    }
    
  
    async nextState() {
       let ms=this.machineStatus;
       switch (this.state) {
           case ms.START:
               this.changeState(ms.END)
               break;
            case ms.END:
                this.writeLog("\n================================================================================")
                this.writeLog(`\nDONE`)
                this.writeLog("\n================================================================================\n\n")
                this.changeState(ms.EXIT)
                break;
           default:
               break;
       }
    };

    get statusDescription(){
        return commonMachineStatusDescription;
    }

    writeLog(message:string="")
    {
         //console dump message
         process.stdout.write(message)
         //file dump message 
        
         fs.writeFileSync(this._path,message,{ 
            encoding: "utf8", 
            flag: "a+", 
          })
    }

    writeStatusResult(state:MachineStatusType,message:string="")
    {
        let ms=this.machineStatus;
        let desc:any=this.statusDescription
        this._logs[ms[state]]={"done":!message,"description":desc[ms[state]] || "","exc":message}
    }

   
    //gestisce il cambio di stato
    changeState(state:MachineStatusType,stateData:any=null){
        
        //stati della macchina
        let ms=this.machineStatus;
        
        if(state!=ms.EXIT)
        {
            this.writeLog(`\nChanging state from ${ms[this._state]} to ${ms[state]}`)
        }

        this._stateData=null;

        //salva dato dello stato
        if(stateData)
        {
            this._stateData=stateData;
        }

                
        //cambia stato corrente al nuovo stato
        this._state=state

        
        //inizializza il log dello stato
        this.writeStatusResult(this._state)
        
    }

}
