
const valueOrDefault=(value)=>{
    return value || "---"
}

function userInfo(user){
   

    let userEmails=user.mailAlternates.filter(m=>m.indexOf("@roma1.infn.it")<0).join(";")
    
    let txt=`
        
        Nome               : ${user.name} 
        Cognome            : ${user.surname}
        UID                : ${valueOrDefault(user.uid)}
        INFN UUID          : ${user.uuid}
        Email              : ${valueOrDefault(user.email)}
        Email alternativi  : ${valueOrDefault(userEmails).split(";").join(`\n&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp`)}
        Telefono           : ${valueOrDefault(user.phone)}
        Ruolo              : ${valueOrDefault(user.role)}
        Scadenza           : ${valueOrDefault(user.expiration)}
       
    `
    return txt.trim().split("\n").map(e=>e.trim()).join("\n");

}

function completeUserInfo(user){
   
    let txt=`${templates.userInfo(user)}
            -----------------------------------------------------------------
            Ruolo roma1        : ${user.role ? 'SI' : 'NO'}
            LOA2               : ${user.loa2 ? 'SI' : 'NO'}
            Disciplinare       : ${user.policies ? 'SI' : 'NO'}
            Corso sicurezza    : ${user.itsec ? 'SI' : 'NO'}
            GraceTime          : ${user.gracetime ? 'SI' : 'NO'}
            -----------------------------------------------------------------
            Autorizzato        : ${user.isAuthorized ? 'SI': 'NO'}`
            
    
    return txt.trim().split("\n").map(e=>e.trim()).join("\n");
}

const templates={
    userInfo,
    completeUserInfo
}


module.exports = {templates}
