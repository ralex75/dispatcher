const getUserLDAP=async function(query){

    
    const ldap=require('ldapjs');
    const usr_list=[];

    const ldap_conf={
             url: 'ldap://dsa.roma1.infn.it',
             //url: 'ldap://aaitestds.lnf.infn.it',
        username: 'cn=daemon,dc=roma1,dc=infn,dc=it',
         userpwd: 'B9B80BE8-CC98-4A6C-9A92-463A87A6B147',
    }
    
    const client=ldap.createClient({
        url: ldap_conf.url
    });
    

    return new Promise(function(resolve,reject){

            client.on('connect',function(){
                
                client.bind(ldap_conf.username, ldap_conf.userpwd, function(err){
                    
                    if(err){
                        console.log(err);
                        reject("bind error:",err);
                    }

                    var opts={

                        filter:query,
                        scope: 'sub',
                        attributes: ['infnUUID','uid','schacpersonaluniqueid', 'givenname', 'sn', 'mail', 'schacUserStatus','eduPersonEntitlement','eduPersonAssurance','mailAlternateAddress','isMemberOf','telephoneNumber'],
                        paged:{pageSize:500},
                        timeLimit: 2000, // 10 minutes in seconds or limit of your choice

                    };

               
                    client.search('ou=people,dc=infn,dc=it',opts,function(err,res){
                        if(err){
                            console.log(err);
                            reject("Query error:",err);
                        }

                        res.on('searchEntry',function(entry){
                           
                            try{
                                
                                var ejson=entry.object;
                               
                                var usr={};
                                var schac=ejson.schacpersonaluniqueid;
                                var edu=ejson.eduPersonEntitlement || false;
                                let assurance=ejson.eduPersonAssurance || false;
                                schac= Array.isArray(schac) ? schac[schac.length-1] : schac;
                               
                                usr.uid=ejson.uid || '--------';
                                usr.uuid=ejson.infnUUID;
                                usr.cf=ejson.infnUUID;
                                usr.isMemberOf=ejson.isMemberOf;
                                usr.loa2      = assurance && assurance.indexOf("urn:mace:infn.it:loa2") >= 0
                                usr.itsec     = edu && edu.indexOf("urn:mace:infn.it:sicurezza-informatica-base") >= 0
                                usr.policies  = edu && edu.indexOf("urn:mace:infn.it:disciplinare-it") >= 0
                                usr.gracetime = edu && edu.indexOf("urn:mace:infn.it:ict-gracetime:true") >= 0
                              
                                //console.log(usr)
                                
                                if(schac)
                                {
                                    schac = schac.split(":");
                                    usr.cf=schac[schac.length-1];
                                }

                                usr.email=ejson.mail;
                                usr.name=ejson.givenname;
                                usr.surname=ejson.sn;
                                usr.source="LDAP";
                                usr.phone=ejson.telephoneNumber;
                                usr.schacUserStatus=ejson.schacUserStatus;
                                usr.mailAlternates=ejson.mailAlternateAddress ? Array.isArray(ejson.mailAlternateAddress) ? ejson.mailAlternateAddress : [ejson.mailAlternateAddress]:[];
                               
                                usr_list.push(usr);
                            }
                            catch(exc)
                            {
                                console.log("exc:",exc)
                            }
                            //console.log('Email entry: ' + JSON.stringify(entry.object));

                        });
                        
                        res.on('searchReference', function(referral) {
                            console.log('referral: ' + referral.uris.join());
                        });
                        
                        res.on('error', function(err) {
                            console.error('error: ' + err.message);
                        });
                        
                        res.on('page', function(result) {
                            //console.log('page end');
                        });

                        res.on('end', function(result) {
                            //console.log('status: ' + result.status);
                            resolve(usr_list);
                        });
                    });
                    
                });

            });

    })

};


module.exports={getUserLDAP};