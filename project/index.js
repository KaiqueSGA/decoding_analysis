//Dev: Kaique Yudji
//Date: 12/12/2022
//Purpose of the code: this code it's responsible per get a FTP server and decode its messages. In this case, the code will analyse 2 differents types code. 
//1:SOC datas(messages sent per device smartOneC, a new device that we are working).
//2:STU datas(mesages sent per device when they can't catch gps Signal). 
//Moreover, this code will create a GPS link with the translated coordinates, format the translated datas in a json object, insert this object in the bucket of device that sent the message, 
//  

 const { Analysis, Services } = require("@tago-io/sdk");

 async function mqttPushExample(context, scope) {

  
 }
 
 module.exports = new Analysis(mqttPushExample, { token: "YOUR-TOKEN" });
 

 