//Dev: Kaique Yudji
//Date: 12/12/2022
//Before starts use this code, it's important read the readme file to know the objective this code.
//Purpose of this file: This file it's responsible per get the FTP server and send the files of server to the right algorithim. Each type of message of server(two types), needs of an algorithim specific
const { Analysis, Account, Utils, Device } = require("@tago-io/sdk");
const Ftp_server = require("ftp");

const stx_messages = require("./classes/decoding_files/stx.js");
const soc_messages = require("./classes/decoding_files/soc.js");
const mqtt_messages = require("./classes/decoding_files/mqtt.js");
const tago_functions = require("./classes/Apis/tago");
const ftp_methods = require("./classes/Apis/ftp");



const cacth_esn = (data) =>{//what is ESN? Read in our README.
  let help = data.indexOf("<esn>");
  let firstTag = data.indexOf(">",help);
  let secondTag = data.indexOf("</esn>",firstTag);
  return data.substring(firstTag + 1,secondTag)
};



const catch_time_stamp = (data) => {
data = data[0];
let helpp = data.indexOf("timeStamp");
let firstTagg = data.indexOf("=",helpp);

let secondTag = data.indexOf("T",firstTagg);
let time_stamp = data.substring(firstTagg+2,secondTag+1);

let date_time_elements = time_stamp.split(" ");// The elements are divided in 3 categories. 0=date; 1=time; 2=time format
let date_elements = date_time_elements[0].split("/");// the date elements are divided in 3 categories. 0=day; 1=month; 2=year;
let time_elements = date_time_elements[1].split(":");//the time elements are dividide in 3 categories. 0=hour; 1=minute; 2:second;     


 time_stamp = new Date(`${date_elements[2]}-${date_elements[1]}-${date_elements[0]}T${time_elements[0]}:${time_elements[1]}:${time_elements[2]}Z`);
return time_stamp;
}





async function Changing_algorithm(file_list, ftp_connection, account_tago){ 
    const tago_function = new tago_functions(account_tago);

    for await(let ftp_file of file_list){
        try{console.log(" ");console.log(ftp_file.name)

            const ftp_method = new ftp_methods(ftp_file.name, ftp_connection);//here i need to fix the nomenclature, because i'm using the function get_file_content that is within of class soc_message but the function get_file_content is universal 
            let file_content = await ftp_method.get_file_content(); //this function retruns an array with all messages that are inside of xml file


            if(file_content === undefined){
              console.log("weren't possible get the content of file");
              await ftp_method.delete_file_from_ftp(); continue;
            }

            let time_stamp = catch_time_stamp(file_content);

            for await(let stu_message of file_content){// I need to do this for because inside of file content, i can have more than one message. The file content can has many stu_messages, therefore i need of more one loopig
              
                let esn_value = cacth_esn(stu_message); 

                let filter = { tags:[ {key:"ESN", value:esn_value} ]};
                let device = await account_tago.devices.list({
                  page: 1,
                  filter,
                });

  
                if(device[0].tags.find(tag => tag.key === 'TYPE' && tag.value === 'SOC') ){console.log("SOC");
                  const smart_one_c_message = new soc_messages();  
                  let decoded_code;

                  decoded_code = smart_one_c_message.decode(stu_message, esn_value);
                  decoded_code !== undefined && (await tago_function.insert_on_tago(decoded_code, Device, device[0].id));
                  decoded_code !== undefined && (await ftp_method.delete_file_from_ftp());
                  
                  
                }else if( device[0].tags.find(tag => tag.key === 'TYPE' && tag.value === 'STX') ){console.log("STX")
                  const stx_message = new stx_messages();
                  let decoded_code;

                  decoded_code = await stx_message.decode(stu_message, esn_value, time_stamp);
                  decoded_code !== undefined && (await tago_function.insert_on_tago(decoded_code, Device, device[0].id));
                  decoded_code !== undefined && (await ftp_method.delete_file_from_ftp());


               }else{
                 //provision algorithim
               }
               
           };
        

        
      }catch(err){
        console.log(`Something went wrong  in the file${ftp_file.name}...`, err);continue
      }
      
         
  }

   console.log("finished");
   process.kill(process.pid, 'SIGINT');
}










/* this function will be the first to be called */
async function Decoding_analysis(context, scope) {
  try{
      /* constants responsibles per access functions of tago.io */
      const envVars = Utils.envToJson(context.environment);
      const account = new Account({ token: envVars.account_token });


      scope = [
        {
            variable: "payload",
            value: "esn;0-4242117;model,AT-G1018;hmv,0.1M4;fmv,0.8M4;mode,2;media,GSM/GPRS;rtc,2023-03-28 17:55:56;battery_volts,1.78;imei,869951032048823;iccid,8944500601200071406F;cops,CLARO BR;jamm,+SJDR: NO JAMMING;rf_model,HC-12;rf_channel,001;rmc,$GNRMC,175856.000,A,2335.73273,S,04638.18158,W,000.2,042.5,280323,,,N,V*0D;vtg,$GNVTG,042.5,T,,M,000.2,N,000.3,K,A*11;zda,$GNZDA,175856.000,28,03,2023,00,00*4A;psti20,$PSTI,20,0,1,1,0,A,1,1,50.80,100.00,-0.01,0.00*4D;psti60,$PSTI,060,0,V,53.40,8.96,345.05,,,,,,,,*62;psti63,$PSTI,063,G,0.53,0.10,0.50,C,0.54,0.10,0.51*05;psti65,$PSTI,065,A,-0.03,-7.41,6.46,N,0.00,0.00,0.00*0B;psti70,$PSTI,070,T,I,52.1*2C;lbs_mode,LTE;lbs0,LBS0,9610,290,-87,-54,-17,-5,46111,28560395,724,05,255",
            metadata: {
                mqtt_topic: "MQTT"
            }
        }
    ]
    


      if(scope.length !== 0){ console.log("MQTT")

          const identify_device_on_tago = async() => {
            let esn = scope[0].value.split(";")[1];

            let filter = { tags:[ {key:"ESN", value:esn} ]}; 
            return await account.devices.list( { page:1, filter } );
          }

          
          const mqtt_message = new mqtt_messages(scope[0]);
          const tago_func = new tago_functions(account); 

          let device_id = await identify_device_on_tago();
          let decoded_code = await mqtt_message.decode(scope);
          //decoded_code !== undefined && await tago_func.insert_on_tago(decoded_code, Device, device_id[0].id, decoded_code);
          
          process.kill(process.pid, 'SIGINT');
      }


      let access_config_ftp_server = {
          host:"kilauea.webhost.net.br",
          secure:true,
          user:"stx3@sga-iot.com",
          password:"Stx3@sga2022"
      }


      const connection = new Ftp_server();
      connection.on('ready', function() {

          connection.list("*.xml", function(err,file_list){

                  if(err){console.log(err)}; 
                  
                  if(file_list.length === 0){
                      connection.destroy();console.log("WITHOUT files in FTP");
                      process.kill(process.pid, 'SIGINT');

                  }else{
                      console.log('reading files...');
                      Changing_algorithm(file_list,connection,account);
                  }
          
          })

      });
      connection.connect(access_config_ftp_server);
      


  }catch(err){
      console.log(err)
  }

};

module.exports = new Analysis(Decoding_analysis, { token: "67937c9b-f516-448c-aad2-c6369fbf8e7a" });

