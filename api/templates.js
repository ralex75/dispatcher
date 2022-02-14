const moment = require("moment")

const valueOrDefault=(value)=>{
    return value || "---"
}

const generateHtmlWhiteSpace=(count)=>{
    if(!count || count<1) count=1
    return [...Array(count).keys()].map(i=>"&nbsp;").join("")
}

const generateHTMLSiteRoles=(siteRoles)=>{
    //return Object.keys(siteRoles).filter(k=>k!='roma1').map(k=>`${k} - ${siteRoles[k]}`)
    return Object.keys(siteRoles).map(k=>`${k.toUpperCase()} - ${siteRoles[k]}`)
}

function userInfo(user){
   

    let userEmails=user.mailAlternates.filter(m=>m.indexOf("@roma1.infn.it")<0).join(";")
    
    let txt=`
        
        Nome               : ${user.name} 
        Cognome            : ${user.surname}
        UID                : ${valueOrDefault(user.uid)}
        INFN UUID          : ${user.uuid}
        CF                 : ${(user.cf!=user.uid) ? valueOrDefault(user.cf) : "---"}
        Email              : ${valueOrDefault(user.email)}
        Email alternativi  : ${valueOrDefault(userEmails).split(";").join(`\n &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`)}
        Telefono           : ${valueOrDefault(user.phone)}
        Sede - Ruolo       : ${valueOrDefault(generateHTMLSiteRoles(user.siteRoles).join("\n "+generateHtmlWhiteSpace(21)))}
        Scadenza           : ${valueOrDefault(user.expiration)}
    `
    return txt.trim().split("\n").map(e=>e.trim()).join("\n");

}

function completeUserInfo(user){
   
    let txt=`${templates.userInfo(user)}
            -----------------------------------------------------------------
            Afferenza Roma1    : ${user.roma1 ? 'SI' : 'NO'}
            LOA2               : ${user.loa2 ? 'SI' : 'NO'}
            Disciplinare       : ${user.policies ? 'SI' : 'NO'}
            Corso sicurezza    : ${user.itsec ? 'SI' : 'NO'}
            GraceTime          : ${user.gracetime ? 'SI' : 'NO'}
            -----------------------------------------------------------------
            Autorizzato        : ${user.isAuthorized ? 'SI': 'NO'}`
            
    
    return txt.trim().split("\n").map(e=>e.trim()).join("\n");
}

const toDate=(date)=>{
    if (!date) return ""
    
    return moment(date).format("DD-MM-YYYY")
}


function userDBInfo(user){
   
        
    let txt=`
        
        Nome               : ${user.name} 
        Cognome            : ${user.surname}
        CF                 : ${valueOrDefault(user.cf)}
        Email              : ${valueOrDefault(user.email)}
        Telefono           : ${valueOrDefault(user.phone)}
        Ruolo              : ${valueOrDefault(user.role)}
        Stato              : ${user.stato}
        Ente               : ${valueOrDefault(user.ente).toUpperCase()}
    `

    txt=txt.trim().split("\n").map(e=>e.trim()).join("\n")

    if (user.role!='FISSO'){
       
        txt+=`
        Tipo               : ${valueOrDefault(user.tipo)}
        Gruppo             : ${valueOrDefault(user.gruppo).toUpperCase()}
        Referente          : ${valueOrDefault(user.referente)}
        Responsabile       : ${valueOrDefault(user.responsabile)}
        Inizio visita      : ${valueOrDefault(toDate(user.inizio_visita))}
        Fine   visita      : ${valueOrDefault(user.fine_visita).split("-").reverse().join("-")}
        `
    }
    else{
        txt+=`
        Scadenza           : ${valueOrDefault(user.expire_date).split("-").reverse().join("-")}
      
        `
    }
    

    return txt.trim().split("\n").map(e=>e.trim()).join("\n");

}


const templates={
    userInfo,
    completeUserInfo,
    userDBInfo
}


module.exports = {templates,generateHtmlWhiteSpace}
