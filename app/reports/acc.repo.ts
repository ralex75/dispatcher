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

       
        var map:any=await this.mapBasicData(user,data);
        

        
        //txt="=====================  Esito esecuzione automatica  ====================<br>"

        if(data.restore && data.restore=='mail'){
           
            let bckmailuser=`${user.uid}-mailbox.tgz`
            let restore_mail_procedure=`
            
                                        ======= Procedura di ripristino mail ================||

                                        <u>ATTENZIONE!!! - Eseguire questi passi solo DOPO aver creato l'account e prima di inviare la mail di test.</u>||

                                        - collegarsi su freezer2|
                                        - <b>cd /data/vm+servizi/bckuser/${user.uid}</b>|
                                        - <b>scp ${bckmailuser}  root@mailbox:. </b>|
                                        - collegarsi su mailbox|
                                        - <b>cd /var/imap</b>|
                                        - <b>tar xzvf /root/${bckmailuser}</b>| 
                                        - <b>cd</b>|
                                        - <b>rm ${bckmailuser}</b>|
                                        =====================================================|
                                        
                                        `
            map["RESTORE_MAIL_PROCEDURE"]=restore_mail_procedure.split("|").map(e=>e.trim()).join("<br>")
            
        }
       
        return map;

    }

}

export {AccountReport}