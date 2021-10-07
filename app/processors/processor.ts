import moment from 'moment';
const axios = require('axios');
import {Report} from '../reports/report'
import {WiFiReport} from '../reports/wifi.repo'
import {IPReport} from '../reports/ip.repo'
import {AccountReport} from '../reports/acc.repo'

enum ProcessResultStatus {"OK","BAD"}

interface iProcessResult{
    getStatus():ProcessResultStatus;
    getValue():any;
    render():string;
}

class ProcessResult implements iProcessResult{
    _status:ProcessResultStatus;
    _value:any;

    constructor(status:ProcessResultStatus,value:any)
    {
        this._status=status;
        this._value=value;
    }

    getStatus():ProcessResultStatus
    {
         return this._status;
    }

    getValue():any{
        return this._value;
    }

    render(){
        return JSON.stringify(this._value)
    }
}

class ProcessResultOK extends ProcessResult{
    constructor(value:any){
        super(ProcessResultStatus.OK,value);
    }
}
class ProcessResultBAD extends ProcessResult{
    constructor(value:any){
        super(ProcessResultStatus.BAD,value);
    }
}

abstract class ProcessRequest{
    user:any;
    data:any;

    constructor(user:any,data:any)
    {
        this.user=user;
        this.data=data;
        if(!this.isValidData(data)){
            throw new Error("Missing required request data fields:"+JSON.stringify(data) || data);
        };
    }

    static initialize(type:string,user:any,data:any){
       
        switch(type)
        {
          
            case "IP":
                return new IP_Processor(user,data);
            break;
            case "WIFI":
                return new WiFi_Processor(user,data);
            break;
            case "ACCOUNT":
                return new Account_Processor(user,data);
            break;
            default:
                //throw Error(`No request handler for request type:${type}`);
                return null;

        }
    }

    //abstract async exec():Promise<Report>
    abstract exec():Promise<Report>

    abstract isValidData(data:any):boolean;

}


class WiFi_Processor extends ProcessRequest 
{

    isValidData({from=null,to=null})
    {
        return !!from && !!to
    }
    
    async exec()
    {
        
        var user=this.user;
        var data=Object.assign({},this.data);
        var processResult:iProcessResult|null=null;
    
        try
        {
           
            const payload={"name":user.name,
                        "surname":user.surname,
                        "email":user.email,
                        "phone":user.phone,
                        "start":moment(data.from).format("YYYY-MM-DD"),
                        "end":moment(data.to).format("YYYY-MM-DD") }
            
           

            let baseUrl='http://localhost:5000'
            
            //crea utente usando wifiguests api
            var res=await axios.post(`${baseUrl}/api/users/create`,{"user":payload,"evid":null})
            
            //invia mail usando wifiguests api
            await axios.post(`${baseUrl}/api/mail/user`,{"uid":res.data.id});

            processResult=new ProcessResultOK(res.data)

        }
        catch(exc)
        {
            processResult=new ProcessResultBAD(exc)
        }

        
        return new WiFiReport(this.user, this.data, processResult);

    }

    
}

class IP_Processor extends ProcessRequest 
{
    isValidData(data:any)
    {
        //Check data
        return true;
    }
    async exec()
    {
        var user=this.user;
        var data=this.data;

        return new IPReport(user,data);
       
    }
  
}

class Account_Processor extends ProcessRequest 
{
    isValidData(data:any)
    {
        //Check data
        return true;
    }
    async exec()
    {
        var user=this.user;
        var data=this.data;

        return new AccountReport(user,data);
       
    }
  
}



export {ProcessRequest,iProcessResult,ProcessResultStatus}
