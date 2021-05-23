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

export{iProcessResult,ProcessResultStatus,ProcessResultOK,ProcessResultBAD}


