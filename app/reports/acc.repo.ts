import {Report} from './report'

class AccountReport extends Report{
    

    getTemplateFileName():string {
        return "account.txt";
    }


    async mapBasicData(user:any,data:any):Promise<any> {

         var map={
                "NAME":user.name,
                "SURNAME":user.surname,
                "EMAIL":data.email, //email desiderata
                "EMAIL_ALT":user.mailAlternates.length>0 ? user.mailAlternates.join(";") : '---',
                "PHONE":user.phone || '---',
                "EXPIRATION":user.expiration,
                "INFNUUID":user.uuid,
                "ROLE":user.role
                }

        return map;

    }

    async mapAdvancedData(user:any,data:any):Promise<any> {

        var txt:string="";
        var map:any=await this.mapBasicData(user,data);
        

        /*
        txt="=====================  Esito esecuzione automatica  ====================<br>"

        //var procResultData:string=map["processResult"] || null;
        console.log("pr:",this.processResult);
        if (this.processResult && this.processResult.status=='OK')
        {
            txt+= JSON.stringify(this.processResult.value);
        }
        else{
            txt="NON GESTITA"
        }

        map["[ADDITIONAL_DATA]"]=txt;*/
       
        return map;

    }

}

export {AccountReport}