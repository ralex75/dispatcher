//const {ReadRequests} = require('./dist/dispatcher.js');

const {ReadRequests} = require('./dist/bundle.js');


setInterval(()=>{
    ReadRequests();
},5000);

console.log("ready")