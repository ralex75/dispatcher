
import moment from 'moment';
import {Report,RenderType} from './reports/report'
import {ReportFactory} from './reports/factory.repo'
import {ProcessRequest, ProcessResultStatus} from './processors/processor'
import {helpers} from './helpers'
const {getUser} = require('./../api/user')



export const ReadRequests=function(){

	//console.log("Reading for new requests...")

	helpers.READ_ALL_REQUESTS().then(function(data:any){
		data.forEach((r:any) => {
			console.log("rid:",r.id);
			handleRequest(r);
		})
	})

}

interface iError{
	type:string,
	from?:string,
	data:any,
	value:string
}

const handleRequest= async function(r:any){

	console.log("handling request id: ",r.id)
	//@id --> richiesta
	//@uid --> user id
	//@rtype --> request type
	//@data --> dati della richiesta
	
	//dati della richiesta
	var {id, uid, rtype, data} = r;
	//var error:{"type":string,"value":string}|null=null;
	//var error:iError|null=null;
	let report:Report | null=null;
	var errors:iError[]=[];

	//var times:{notific:Moment | null ,process:Moment | null};
	var times:any={"notific":null,"process":null}

	let userEmails:string [] | null=null;
	let userMailAddr:string="";
	let suppEmail="supporto@roma1.infn.it"
		
	try{

		if(!uid || !rtype || !data){
			var args={"uid":uid,"type":rtype,"data":data};
			throw new Error(`Invalid request data, missing some arguments`);
		}
		
		//recupera utente da LDAP
		let user=await getUser(uid);
		
		//tutte le mail dell'utente
		userEmails=[user.email,...user.mailAlternates]
		
		//selezione se presente indirizzo nome.cognome@roma1 oppure il suo indirizzo principale
		//campo mail
		userMailAddr=userEmails.filter(e=>e.match(/^(\w+(\.\w+)+@roma1.infn.it)$/))[0] || "";

		userMailAddr=userMailAddr || user.email;

		if(!userMailAddr){ throw new Error("User mail address is empty") }
		
		//fare controllo utente se autorizzato
		//TO DO CHECK USER AUTH ?
		let isValid = user.isAuthorized;

		if(!isValid)
		{
			throw new Error("User is not authorized!:"+JSON.stringify(user))
		}

		
		// inizializza il processatore della richiesta
		let processor:any=null;
		
		//******** Processamento automatico della richiesta **********//
		try
		{
			//inizializza il processatore di richiesta
			processor=ProcessRequest.initialize(rtype,user,data);
					
			//gestione automatica della richiesta (se implementato)
			//ritorna oggetto di tipo report (wifi,account o IP)
			if(processor)
			{
				report=await processor.exec();

				console.log(`Processed Request ID: ${id} - ${rtype}`)

				
				if(report?.processResult && report.processResult.getStatus()==ProcessResultStatus.BAD)
				{
					console.log("Eccezione processamento")
					throw new Error(report.processResult.getValue());
				}
			}

		}
		catch(exc:any)
		{
			errors.push({"type":"process","value":(exc.message || JSON.stringify(exc)),"data":data})
		}

		//se l'oggetto report non è stato creato (il process.exec ha generato errore)
		//dobbiamo comunque inviare i dati di report utente e supporto
		if(!report)
		{
			report= ReportFactory.initialize(rtype,user,data);
		}
		
		
		//basic report => user
		var basicrepo = await report.renderAs(RenderType.BASIC);

		//advanced report => admin
		var advrepo = await report.renderAs(RenderType.ADVANCED);

		

		//default mail subject
		var mailSubj=`Richiesta ID ${id} - ${rtype}`;
	

		//additional report subject
		var subj = report.getSubject()


		if(subj!="")
		{
			mailSubj=mailSubj+=` - ${subj}`
		}

		//Invia Report all'utente
		console.log("sending basic report to user address: ",userMailAddr)
		helpers.sendReport(suppEmail,userMailAddr,mailSubj,basicrepo);

		//Invia Report al servizio 
		console.log("sending adv report to supporto: ",suppEmail)
		helpers.sendReport(userMailAddr,suppEmail, mailSubj+" -- Riservata Supporto --",advrepo);

		times.notific=moment();
		

	}
	catch(exc:any)
    {
		console.log(exc);
		let from = !userMailAddr ? "dispatcher" : userMailAddr
		errors.push({"type":"request","from":from,"data":data,"value":(exc.message || JSON.stringify(exc))})
    }
    finally
    {

		times.process=moment()
		
		errors.forEach(err=>
		{
			
			let errTxt=JSON.stringify(err);
			
			/*
			if(err.type=="request" && userEmails!=null)
			{
				helpers.sendReport(userEmails.join(";"),`Errore invio richiesta  ID - ${r.id} - Type - ${r.rtype}`,errTxt);	
			}*/

			//let to=user ? user.email : "alessandro.ruggieri@roma1.infn.it";//"supporto@®roma1.infn.it"
			helpers.sendReport(suppEmail,suppEmail,`Errore elaborazione richiesta  ID - ${r.id} - Type - ${r.rtype}`,errTxt);
	
		})
		

		helpers.setDispatchResult(id,times.notific,times.process,JSON.stringify(errors))

		console.log(`${errors.length>0 ? "error": "done"} request id: ${r.id}`)
    }
}



