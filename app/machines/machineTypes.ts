export enum BasicMachineStatus {START=1,END,EXIT,ERROR}
export enum CreateMachineStatus {CHECK_DEST_PORT=100,SWP_TO_DHCP,HOST_SAVE}
export enum UpdateMachineStatus {CHECK_DEST_PORT=200,CHECK_SOURCE_PORT,SWP_TO_DHCP,SWP_SYNC,DISABLE_SOURCE_PORT,HOST_SAVE}
export enum DeleteMachineStatus {CHECK_SOURCE_PORT=300,DISABLE_SOURCE_PORT,HOST_DELETE}

export type CreateMachineStatusType=CreateMachineStatus | BasicMachineStatus
export type UpdateMachineStatusType=UpdateMachineStatus | BasicMachineStatus
export type MachineStatusType = CreateMachineStatusType | UpdateMachineStatus | DeleteMachineStatus


export const commonMachineStatusDescription={
    START:"Inizio esecuzione",
    SWP_TO_DHCP:"Impostazione porta switch a DHCP e sincronizzazione",
    HOST_SAVE:'Inserimento o aggiornamento nodo e sincronizzazione in DHCP server',
    END:"Fine esecuzione",
    EXIT:"Terminato"
}

export const createMachineStatusDescription=
            {
                ...{
                    CHECK_DEST_PORT:"Controllo porta di destinazione collegata e senza nodi",
                    HOST_SAVE:'Registrazione informazioni nuovo nodo nel DB'
                },
                ...commonMachineStatusDescription
            }

export const updateMachineStatusDescription=
            {
                ...{
                    CHECK_DEST_PORT:"Controllo porta di destinazione collegata e senza nodi",
                    HOST_SAVE:'Salvataggio informazioni del nodo nel DB e sincronizzazione'
                },
                ...commonMachineStatusDescription
            }

export const deleteMachineStatusDescription=
            {
                ...{
                    CHECK_SOURCE_PORT:"Controllo porta del nodo",
                    DISABLE_SOURCE_PORT:"Disabilitazione porta del nodo",
                    HOST_DELETE:'Rimozione informazioni del nodo dal DB'
                },
                ...commonMachineStatusDescription
            }


export class CustomError extends Error{
    private date:any;
    
    constructor(...params:any[]){
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError)
        }

      
        this.name="CustomError";
        this.date=new Date()
    }

}