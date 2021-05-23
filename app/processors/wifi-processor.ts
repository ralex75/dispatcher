const axios = require('axios');
import moment from 'moment';
import {ProcessRequest} from './processor'
import {iProcessResult,ProcessResultOK,ProcessResultBAD} from './process-result'
import {WiFiReport} from '../reports/wifi.repo'


class WiFi_Processor extends ProcessRequest 
{

    constructor(id:number,user:any,data:any)
    {
        super(id,user,data)
    }

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


export {WiFi_Processor}