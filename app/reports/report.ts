
import {iProcessResult} from '../processors/processor'
/*import {WiFiReport} from './wifi.repo'
import {IPReport} from './ip.repo'
import {AccountReport} from './acc.repo'*/
import fs from 'fs';
const path = require('path');
const {parseLDAPUserInfo} = require ('../api/uitemplate')


enum RenderType {"BASIC","ADVANCED"}

abstract class Report
{
    user:any=null;
    data:any=null;
    processResult:iProcessResult|null=null;
    subject:string="";
    
    constructor(user:any,data:any,res:iProcessResult|null=null){
       this.user=user;
       this.data=data;
       this.processResult=res;
    }

    getProcessResult():iProcessResult|null {
        return this.processResult;
    }

    getSubject():string {
        return this.subject;
    }

    abstract getTemplateFileName():string

    async renderAs(type:RenderType):Promise<string>{

        
        var fileName=this.getTemplateFileName();
        var filePath=`server/text/${RenderType[type]}/${fileName}`
        filePath=path.resolve(filePath.toLowerCase());

        if(!fs.existsSync(filePath)){
            throw Error(`Missing file template: ${filePath}`);
        }
        
        var txt:string = fs.readFileSync(filePath,'utf-8');
        var md=await this.mapData(this.user,this.data,type);
        this.subject=md['SUBJ'] || ""
        txt=this.replaceFieldValues(txt,md)
        txt=txt.replace(/\[USER_FULL_NAME\]/gi,`${this.user.name} ${this.user.surname}`)

        return txt;

    }

    mapData(user:any,data:any,repType:RenderType)
    {
        switch(repType)
        {
            case RenderType.BASIC:
                return this.mapBasicData(user,data);
            break;
            case RenderType.ADVANCED:
                return this.mapAdvancedData(user,data);
            break;
        }
    }

    //mappa i dati per il report basic da inviare utente
    abstract mapBasicData(user:any,data:any):Promise<any>

    //mappa i dati per il report avanzato da inviare supporto
    abstract mapAdvancedData(user:any,data:any):Promise<any>


    replaceFieldValues(txt:string,obj:any):string
    {
        var _txt=txt
       
        
        for(var k in obj)
        {
            //se nn trova la chiave e ha un valore, l'appende in coda
            //if(obj[k]!="" && _txt.indexOf(k)<0) _txt+=k;
            //replace dei campi nel testo
           _txt=_txt.replace(new RegExp("\\["+k+"\\]","g"),obj[k])
        }

        return _txt
    }

}


export {Report,RenderType};


