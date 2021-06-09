import {Report} from './report'
import {ProcessResultStatus} from '../processors/processor'
import moment from 'moment';

const DATE_FORMAT="DD/MM/YYYY";

class WiFiReport extends Report{
    

    getTemplateFileName():string {
        return "wifi.txt";
    }


    async mapBasicData(user:any,data:any):Promise<any> {

        var {from,to}=data;

        var map={
                "NAME":user.name,
                "SURNAME":user.surname,
                "EMAIL":user.email,
                "PHONE":user.phone || '---',
                "FROM":moment(from).format(DATE_FORMAT),
                "TO":moment(to).format(DATE_FORMAT),
                "NOTES":""
                }

        return map;

    }

    async mapAdvancedData(user:any,data:any):Promise<any> {

        var txt:string="";
        var map:any=await this.mapBasicData(user,data);
        

        txt="<b>Esito esecuzione automatica</b><br>"

        //var procResultData:string=map["processResult"] || null;
        //console.log("pr:",this.processResult);
        if (this.processResult)
        {
            var value=JSON.stringify(this.processResult.getValue());
            txt+= this.processResult.getStatus()==ProcessResultStatus.OK ? `${value}` : "NON GESTITA"
           
        }
      
        map["PROCESS_RESULT"]=txt;
       
        return map;

    }

}

export {WiFiReport}