const nodeMailer = require('nodemailer');

function sendMail(from,to,subj,body){
    
    //solo per debug
    to="alessandro.ruggieri@roma1.infn.it"
    
    let to_arr=to.split(";")
    //console.log("Mailer is sending to:",to_arr)

    let transporter = nodeMailer.createTransport({
        host: 'smtp.roma1.infn.it',
        port: 25
    });

    let mailOptions={
        from:from,
        to:to_arr,
        subject:subj,
        html:body
    }


    return new Promise(function(resolve,reject){
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject({success: false});
            } else {
                resolve({success: true})
            }
        });
    })
   
}

module.exports={sendMail};