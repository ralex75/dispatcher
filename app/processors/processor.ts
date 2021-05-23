
import {Report} from '../reports/report'



abstract class ProcessRequest{
    user:any;
    data:any;
    id:number;

    constructor(id:number,user:any,data:any)
    {
        this.id=id;
        this.user=user;
        this.data=data;
        
        if(!this.isValidData(data)){
            throw new Error("Missing required request data fields:"+JSON.stringify(data) || data);
        };
    }

    

    //abstract async exec():Promise<Report>
    abstract exec():Promise<Report>

    abstract isValidData(data:any):boolean;

}


export {ProcessRequest}






//export {ProcessRequest,iProcessResult,ProcessResultStatus}
