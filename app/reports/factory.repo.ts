import {WiFiReport} from './wifi.repo'
import {IPReport} from './ip.repo'
import {AccountReport} from './acc.repo'

class ReportFactory
{
    
    static initialize(type:string,user:any,data:any){
        switch(type)
        {
            case "IP":
                return new IPReport(user,data)
            break;
            case "WIFI":
                return new WiFiReport(user,data)
            break;
            case "ACCOUNT":
                return new AccountReport(user,data)
            break;
            default:
                throw Error("Invalid Request type")
        }
    }
}


export {ReportFactory}