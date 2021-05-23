
import {IP_Processor} from './ip-processor'
import {WiFi_Processor} from './wifi-processor'
import {Account_Processor} from './account-processor'

class ProcessFactory{
    
    static initialize(request:any,user:any,data:any){
       
        let {id,rtype:type}=request;
                
        switch(type)
        {
          
            case "IP":
                return new IP_Processor(id,user,data);
            break;
            case "WIFI":
                return new WiFi_Processor(id,user,data);
            break;
            case "ACCOUNT":
                return new Account_Processor(id,user,data);
            break;
            default:
                throw Error(`No request handler for request type:${type}`);

        }


    }
}

export {ProcessFactory}