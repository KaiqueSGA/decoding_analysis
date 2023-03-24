  //Dev: Kaique Yudji
  //Date: 12/12/2022
  //Before starts use this code, it's important read the readme file to know the objective this code.
  //Purpose of this file: This file it's responsible per get the FTP server and send the files of server to the right algorithim. Each type of message of server(two types), needs of an algorithim specific

  const { Analysis,Account, Utils, Services, Device } = require("@tago-io/sdk");
  const Ftp_server = require("ftp");

  const external_functions = require('./classes/ftp_and_tago_functions');
  const stx_messages = require('./classes/stx.js');
  const soc_messages = require('./classes/soc.js');
  const mqtt_messages = require('./classes/mqtt.js');
  const tago_functions = require('./classes/Apis/tago');





  async function Changing_algorithm(file_list, ftp_connection, account_tago){

      const cacth_esn = (data) =>{//what is ESN? Read in our README.
          let help = data.indexOf("<esn>");
          let firstTag = data.indexOf(">",help);
          let secondTag = data.indexOf("</esn>",firstTag);
          return data.substring(firstTag + 1,secondTag)
      };


      const catch_time_stamp = (data) => {console.log(data)
        data = data[0];
        let helpp = data.indexOf("timeStamp");
        let firstTagg = data.indexOf("=",helpp);
      
        let secondTag = data.indexOf("T",firstTagg);
        let time_stamp = data.substring(firstTagg+2,secondTag+1);

        let date_time_elements = time_stamp.split(" ");// The elements are divided in 3 categories. 0=date; 1=time; 2=time format
        let date_elements = date_time_elements[0].split("/");// the date elements are divided in 3 categories. 0=day; 1=month; 2=year;
        let time_elements = date_time_elements[1].split(":");//the time elements are dividide in 3 categories. 0=hour; 1=minute; 2:second;     
      
        
         time_stamp = new Date(`${date_elements[2]}-${date_elements[1]}-${date_elements[0]}T${time_elements[0]}:${time_elements[1]}:${time_elements[2]}Z`);console.log(time_stamp);
        return time_stamp;
      }


      
    
        for await(let ftp_file of file_list){
            try{console.log(" ");console.log(ftp_file.name)

                const ftp_functions = new external_functions(ftp_file.name, ftp_connection);//here i need to fix the nomenclature, because i'm using the function get_file_content that is within of class soc_message but the function get_file_content is universal 
                let file_content = await ftp_functions.get_file_content(); //this function retruns an array with all messages that are inside of xml file
                let time_stamp = catch_time_stamp(file_content);


                if(file_content === undefined){
                  console.log("weren't possible get the content of file");
                  await smart_one_c_message.delete_file_from_ftp(); continue;
                }



              for await(let stu_message of file_content){// I need to do this for because inside of file content, i can have more than one message. The file content can has many stu_messages, therefore i need of more one loopig
                  
                    let esn_value = cacth_esn(stu_message); 
  
                    let filter = { tags:[ {key:"ESN", value:esn_value} ]};
                    let device = await account_tago.devices.list({
                      page: 1,
                      filter,
                    });
                    
      
                    if( device[0].tags.find(tag => tag.key === 'TYPE' && tag.value === 'SOC') ){console.log("SOC");
                      const smart_one_c_message = new soc_messages(ftp_file.name, ftp_connection);  
                      let decoded_code;

                      decoded_code = smart_one_c_message.decode(stu_message, esn_value); 
                      decoded_code !== undefined && await smart_one_c_message.insert_on_tago(decoded_code, account_tago, Device, device[0].id, stu_message);
                      decoded_code !== undefined && await smart_one_c_message.delete_file_from_ftp(); 
                      
                      
                    }else if( device[0].tags.find(tag => tag.key === 'TYPE' && tag.value === 'STX') ){console.log("STX")
                      const stx_message = new stx_messages(ftp_file.name, ftp_connection);
                      let decoded_code;

                      decoded_code = stx_message.decode(stu_message, esn_value);
                      decoded_code !== undefined && await stx_message.insert_on_tago(decoded_code, account_tago, Device, device[0].id, stu_message, time_stamp);
                      //decoded_code !== undefined && await stx_message.delete_file_from_ftp(); 
    
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
  async function Decoding_analysis(context, scope) {console.log(scope);
      try{
          /* constants responsibles per access functions of tago.io */
          const envVars = Utils.envToJson(context.environment);
          const account = new Account({ token: envVars.account_token });

          scope = [  
            {
              variable: 'payload',
              value: 'esn;0-4242117;model,AT-G1018;hmv,0.1M4;fmv,0.8M4;mode,BEACON;media,GSM/GPRS;rtc,2023-03-24 18:40:23;battery_volts,3.84;imei,869951032048823;iccid,8944500601200071406F;cops,CLARO BR;jamm,+SJDR: NO JAMMING;rf_model,HC-12;rf_channel,001;rmc,$GNRMC,184028.000,V,2335.73047,S,04638.18496,W,000.0,000.0,240323,,,N,V*15;vtg,$GNVTG,000.0,T,,M,000.0,N,000.0,K,N*1C;zda,$GNZDA,184028.000,24,03,2023,00,00*49;psti20,$PSTI,20,0,1,1,0,N,1,0,-1.04,100.00,0.00,0.00*7A;psti60,$PSTI,060,0,V,0.00,34.16,0.00,,,,,,,,*60;psti63,$PSTI,063,G,0.52,-0.01,0.29,C,0.53,-0.01,0.28*03;psti65,$PSTI,065,A,0.85,-8.09,5.50,N,0.00,0.00,0.00*2F;psti70,$PSTI,070,T,I,57.6*2E;mac0,08:a7:c0:76:13:10;mac1,c0:3d:d9:10:79:f0;mac2,ce:32:e5:21:0b:80;lbs_mode,LTE;lbs0,LBS0,9610,290,-93,-56,-18,-8,46111,28560395,724,05,255',
              metadata: { mqtt_topic: 'MQTT' }
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
              decoded_code !== undefined && await tago_func.insert_on_tago(decoded_code, Device, device_id[0].id, decoded_code);
              return;
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



 

 