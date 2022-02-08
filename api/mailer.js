const nodeMailer = require('nodemailer');

function sendMail(from,to,subj,body){
    
    let to_arr=to.split(";")
   
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