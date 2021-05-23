import {AccountReport} from '../reports/acc.repo'
import {ProcessRequest} from './processor'

class Account_Processor extends ProcessRequest 
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
    async exec()
    {
        var user=this.user;
        var data=this.data;

        return new AccountReport(user,data);
       
    }
  
}

export {Account_Processor}
