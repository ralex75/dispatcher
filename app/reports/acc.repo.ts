import {Report} from './report'

class AccountReport extends Report{
    

    getTemplateFileName():string {
        return "account.txt";
    }

    async mapBasicData(user:any,data:any):Promise<any> {

        let restore_ita:any={"mail":"contenuto della casella di posta elettronica",
                             "afs":"files AFS",
                             "mail-afs":"contenuto della casella di posta elettronica e files AFS"}

        let restore_eng:any={"mail":"e-mailbox content",
                             "afs":"AFS files",
                             "mail-afs":"e-mailbox content and AFS files"}

        let userEmails:any=[user.email,...user.mailAlternates]
        userEmails = userEmails[0] ? userEmails.join("; ") : ""
        

        var map={
                    "UID":user.uid || '---',
                    "NAME":user.name,
                    "SURNAME":user.surname,
                    "EMAIL":data.email,     //email desiderata
                    "EMAIL_ALT":userEmails, //lista email utente separate da ';'
                    "PHONE":user.phone || '---',
                    "EXPIRATION":user.expiration,
                    "INFNUUID":user.uuid,
                    "ROLE":user.role,
                    "RESTORE_ITA":restore_ita[data.restore] || 'Nessuno',
                    "RESTORE_ENG":restore_eng[data.restore] || 'None',
                    "RESTORE_MAIL_PROCEDURE":""
                }

        return map;

    }

    async mapAdvancedData(user:any,data:any):Promise<any> {

       
        var map:any=await this.mapBasicData(user,data);

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