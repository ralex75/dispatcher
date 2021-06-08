const {getUserLDAP} = require('./ldap.js') 


//ritorna UTENTE LDAP
const getUser=async function(uid)
{
        
    //GUARDA NEL RAMO NAZIONALE perchè utenti con account di posta appena creato NON hanno is member of ROMA 1
    var queryLDAP =`(infnUUID=${uid})`
    
    var user=null;

    try{

            
            //LDAP
            var users_ldap=await getUserLDAP(queryLDAP);

            user=parseLDAPUserInfo(users_ldap[0])

            console.log(user)

            delete user['isMemberOf']
            delete user["schacUserStatus"];


        }
        catch(exc){
            console.log("exc:",exc);
            throw exc;
        }

    return user;
   
};


var parseLDAPUserInfo=function (user) {
    
    var cuser=Object.assign({}, user);

    console.log(cuser)
    
    //var minTime="01/01/1900"
    var userStatus=user.schacUserStatus;
    
    console.log("mail alternates:",cuser.mailAlternates)
    
    //rimuove dall'alternateMailAddress se esiste mail principale per evitare duplicati
    cuser.mailAlternates=cuser.mailAlternates.map(e=>e.toLowerCase())
                                             .filter(e=>e.indexOf(cuser.email.toLowerCase())<0).sort()
    

    let ma=cuser.mailAlternates;
    
    cuser.mailAlternates=ma.filter(e=>e.match(/\w+\.\w+@/)).sort()
                        .concat(ma.filter(e=>!e.match(/\w+\.\w+@/)).sort())


    let isMemberOf=user.isMemberOf;
    let role="";            //ruolo
    let isAdmin=false       //se appartiene al cc
    let minTime="01/01/1900"
 
    //REG VALIDATIONS
    let regx={"policies":/disciplinare-it/,
              "itsec":/sicurezza-informatica-base/,
              "gracetime":/ict-gracetime:(true|false)/,
              "ttl":/attivo\+ttl\=(\S+)/}
   
   
    if(userStatus && Array.isArray(userStatus)){
        for(let i=0;i<userStatus.length;i++){

            let ttl=regx.ttl.exec(userStatus[i]);
           
            if(ttl && minTime!="nolimit"){
                curTime=ttl[1];
                if(curTime=="nolimit")
                {
                    minTime=curTime;
                }
                else{
                    if(curTime>minTime)
                    {
                        minTime=curTime;
                    } 
                }
            }
         
        }

        cuser["expiration"]= (minTime=='nolimit' ? 'nessuna' : minTime);
        
    }

    //recupera ruolo
    if(isMemberOf){

       _isMemberOf = !Array.isArray(isMemberOf) ? [isMemberOf] : isMemberOf;
        
        /*if(e.indexOf("i:infn:roma1:servizio_calcolo_e_reti")>-1)
        {
            isAdmin=true;
        }*/
        let roles={"d":"dipendente","o":"ospite","a":"associato","v":"visitatore"}

        _isMemberOf.forEach(e=>{
            let match=e.match(/i:infn:roma1::([d|o|a|v])/);
            if(match) {
                role = roles[match[1]] || null
            }
        })


    }

    //controllo se autorizzato
    const {loa2, itsec, policies, gracetime} = cuser;
    
    let isAuthorized = role && loa2 && policies;

    if(isAuthorized && !itsec)
    {
        isAuthorized=gracetime;
    }
    

    cuser["isAuthorized"]=isAuthorized
    cuser["role"]=role;
    //cuser["isAdmin"]=isAdmin;

    delete cuser["isMemberOf"]
    delete cuser["schacUserStatus"];
    
    return cuser;

}



module.exports={getUser}


