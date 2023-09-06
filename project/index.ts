/* 
    Analysis purpose:This analysis it's responsible per get the fpt server(or decode messages ), looking for xml files, These xml file contains messages sent by device. This message is encoded in the hexadecimal format.
    After of get the Xml file's content, the script will decode the informations and insert them in the TAGO.IO
    
    Script purpose: Exclusively this script will consult the FTP server(or receive the mqtt message), identify which device sent the message, after this, the script will send the 
    file content to its decoding function and with the decoded message, the script'll call the function to insert the decoded message at TAGO.IO;

    Developer: Kaique Yudji;
    Date: 22/08/2023;
*/


const { Analysis, Utils, Device, Resources} = require("@tago-io/sdk");
const Ftp_server = require("ftp");

import { stx_message } from "./classes/decoding_files/stx";
import { tago_functions } from "./classes/Apis/tago";
import { ftp_methods } from "./classes/Apis/ftp";
import  mqtt_messages  from "./classes/decoding_files/mqtt/mqtt_message";




//ESN is the device serial number(device identifier), through of this number, we can identify wich device sent the message;
//The parameter DATA is the content of xml file;
const cacth_esn = (data: string): string =>{
  let help: number = data.indexOf("<esn>");

  let firstTag: number = data.indexOf(">",help);
  let secondTag: number = data.indexOf("</esn>",firstTag);
  return data.substring(firstTag + 1,secondTag);
};



//TimeStamp correspons to the dateTime that the message was sent;
//The parameter DATA is the content of xml file;
const catch_time_stamp = (data: string): Date => {
  data = data[0];
  let helpp: number = data.indexOf("timeStamp");

  let firstTagg: number = data.indexOf("=",helpp);
  let secondTag: number = data.indexOf("T",firstTagg);

  let time_stamp: string = data.substring(firstTagg+2,secondTag+1);
  
  let date_time_elements: Array<string> = time_stamp.split(" ");// The elements are divided in 3 categories. 0=date; 1=time; 2=time format
  let date_elements: Array<string> = date_time_elements[0].split("/");// the date elements are divided in 3 categories. 0=day; 1=month; 2=year;
  let time_elements: Array<string> = date_time_elements[1].split(":");//the time elements are dividide in 3 categories. 0=hour; 1=minute; 2:second;     
  
  
  let final_date: Date = new Date(`${date_elements[2]}-${date_elements[1]}-${date_elements[0]}T${time_elements[0]}:${time_elements[1]}:${time_elements[2]}Z`);
  return final_date;
  };



//This function will get the content of each file, analyze if the device that sent the message exists in the platform, and if it exists we're going to decode the message,
//and isert it at the TAGO.IO;
async function Changing_algorithm(file_list: Array<any>, ftp_connection: any, account_tago: any): Promise<void>{ 
  const tago_function = new tago_functions(account_tago);

  for await(let ftp_file of file_list){
      try{console.log(" ");console.log(ftp_file.name)

          const ftp_method = new ftp_methods(ftp_file.name, ftp_connection);
          let file_content: string | undefined = await ftp_method.get_file_content(); 


          if(file_content === undefined){ console.log("weren't possible get the content of file"); await ftp_method.delete_file_from_ftp(); continue;}
          let time_stamp: Date = catch_time_stamp(file_content);

              
           for await(let stu_message of file_content){// I need to do this for because inside of file content, i can have more than one message. The file content can has many stu_messages, a stu_message corresponds the one message sent by device
            
              let esn_value: string = cacth_esn(stu_message); 
              let filter = { tags:[ {key:"ESN", value:esn_value} ]};
              let device = await account_tago.devices.list( { page: 1, filter }); 

             
              if(device && device[0].tags.find((tag: any) => tag.key === 'TYPE' && tag.value === 'STX') ){console.log("STX")
                const stx_messages = new stx_message();
                let decoded_code: any = await stx_messages.decode(stu_message, esn_value, time_stamp);

                decoded_code !== undefined && (await tago_function.insert_on_tago(decoded_code, Device, device[0].id));
                await ftp_method.delete_file_from_ftp();

             }else{ console.log("Device isn't registered in TAGO.IO"); continue;  }
              
         }; 
      

      
    }catch(err){
      console.log(`Something went wrong  in the file${ftp_file.name}...`, err);continue
    }
    
       
}

 console.log("finished");
 process.kill(process.pid, 'SIGINT');
}






//This function will be the first to be called, this functions represents the own analysis, It starts the algorithim;
//This funcion consults the FTP server, and verify if a mqtt message was sent. After receive the files(or mqtt messages), this funcrion will call the other functions in the script above.
async function Decoding_analysis(context: any, scope: any): Promise<void> {  
  try{
      /* constants responsibles per access functions of tago.io */
      const envVars = Utils.envToJson(context.environment);
      const resources = new Resources({ token: envVars.account_token });


      scope = [  
        {
          variable: 'payload',
          value: 'esn;0-4242117;model,AT-G1018;hmv,0.1M4;fmv,0.8M4;mode,BEACON;media,GSM/GPRS;rtc,2023-03-24 18:40:23;battery_volts,3.84;imei,869951032048823;iccid,8944500601200071406F;cops,CLARO BR;jamm,+SJDR: NO JAMMING;rf_model,HC-12;rf_channel,001;rmc,$GNRMC,184028.000,V,2335.73047,S,04638.18496,W,000.0,000.0,240323,,,N,V*15;vtg,$GNVTG,000.0,T,,M,000.0,N,000.0,K,N*1C;zda,$GNZDA,180528.000,04,09,2023,00,00*49;psti20,$PSTI,20,0,1,1,0,N,1,0,-1.04,100.00,0.00,0.00*7A;psti60,$PSTI,060,0,V,0.00,34.16,0.00,,,,,,,,*60;psti63,$PSTI,063,G,0.52,-0.01,0.29,C,0.53,-0.01,0.28*03;psti65,$PSTI,065,A,0.85,-8.09,5.50,N,0.00,0.00,0.00*2F;psti70,$PSTI,070,T,I,57.6*2E;mac0,08:a7:c0:76:13:10;mac1,c0:3d:d9:10:79:f0;mac2,ce:32:e5:21:0b:80;lbs_mode,LTE;lbs0,LBS0,9610,290,-93,-56,-18,-8,46111,28560395,724,05,255',
          metadata: { mqtt_topic: 'MQTT' }
        }
      ]


      if(scope.length !== 0){//If exists something in the scope, the analysis received a mqtt message

          const identify_device_on_tago = async() => {
            let esn: Array<string> = scope[0].value.split(";")[1];

            let filter: any = { tags:[ {key:"ESN", value:esn} ]}; 
            let device_obj = await resources.devices.list( { page:1, filter } );

            if(device_obj.length === 0) { console.log("Device isn't registered in TAGO.IO"); return }
            else{ return await resources.devices.list( { page:1, filter } ); };
          }

          const tago_func = new tago_functions(resources); 

          let device_id = await identify_device_on_tago();
          let decoded_code = await mqtt_messages(scope); console.log(decoded_code)
          decoded_code !== undefined && await tago_func.insert_on_tago(decoded_code, Device, device_id[0].id);
          
          process.kill(process.pid, 'SIGINT');//This line code broke the algorithim;
      }



      let access_config_ftp_server = {//Setting of access of FTP server
          host:"kilauea.webhost.net.br",
          secure:true,
          user:"stx3@sga-iot.com",
          password:"Stx3@sga2022"
      }


      const connection = new Ftp_server();
      connection.on('ready', function() {

          connection.list("*.xml", function(err: any, file_list: Array<any>){

                  if(err){console.log(err)}; 
                  
                  if(file_list.length === 0){
                      connection.destroy();console.log("WITHOUT files in FTP");
                      process.kill(process.pid, 'SIGINT');

                  }else{
                      console.log('reading files...');
                      Changing_algorithm(file_list,connection,resources);
                  }
          
          })

      });
      connection.connect(access_config_ftp_server);
      


  }catch(err){
      console.log(err)
  }

};

module.exports = new Analysis(Decoding_analysis, { token: "a-d613ab14-9937-49ae-aa53-9c5487f2547c" });
