
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
        Email alternativi  : ${valueOrDefault(userEmails)}
        Telefono           : ${valueOrDefault(user.phone)}
        Ruolo              : ${user.role}
        Scadenza           : ${user.expiration}
       
    `
    return txt.trim().split("\n").map(e=>e.trim()).join("\n");

}

const templates={
    userInfo
}


module.exports = {templates}
