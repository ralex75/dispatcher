
const valueOrDefault=(value)=>{
    return value || "---"
}

function parseLDAPUserInfo(user){
   

    let userEmails=[user.email,...user.mailAlternates]
    userEmails = userEmails[0] ? userEmails.join("; ") : "";
    
    
    let txt=`
    
        IDENTIFICATIVO UTENTE
        ----------------------------------------------------------------
        Nominativo         : ${user.name} ${user.surname}
        uid                : ${valueOrDefault(user.uid)}
        infnUUID           : ${user.uuid}
        Email              : ${valueOrDefault(user.email)}
        Email alternativi  : ${userEmails}
        Telefono           : ${valueOrDefault(user.phone)}
        Ruolo              : ${user.role}
        Scadenza           : ${user.expiration}
        -----------------------------------------------------------------
        Ruolo roma1        : ${user.isAuthorized ? 'SI' : 'NO'}
        LOA2               : ${user.loa2 ? 'SI' : 'NO'}
        Disciplinare       : ${user.policies ? 'SI' : 'NO'}
        Corso sicurezza    : ${user.itsec ? 'SI' : 'NO'}
        GraceTime          : ${user.gracetime ? 'SI' : 'NO'}
        
    `
    return txt.trim().split("\n").map(e=>e.trim()).join("\n");

}

module.exports = {parseLDAPUserInfo}
