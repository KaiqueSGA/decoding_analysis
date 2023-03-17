  //Dev: Kaique Yudji
  //Date: 12/12/2022
  //Before starts use this code, it's important read the readme file to know the objective this code.
  //Purpose of this file: This file it's responsible per get the FTP server and send the files of server to the right algorithim. Each type of message of server(two types), needs of an algorithim specific

  const { Analysis,Account, Utils, Services, Device } = require("@tago-io/sdk");
  const Ftp_server = require("ftp");

  const external_functions = require('./classes/ftp_and_tago_functions');
  const stx_messages = require('./classes/stx.js');
  const soc_messages = require('./classes/soc.js');





  async function Changing_algorithm(file_list, ftp_connection, account_tago){

      const cacth_esn = (data) =>{//what is ESN? Read in our README.
          let help = data.indexOf("<esn>");
          let firstTag = data.indexOf(">",help);
          let secondTag = data.indexOf("</esn>",firstTag);
          return data.substring(firstTag + 1,secondTag)
      };
      
    
        for await(let ftp_file of file_list){
            try{console.log(" ");console.log(ftp_file.name)

                const ftp_functions = new external_functions(ftp_file.name, ftp_connection);//here i need to fix the nomenclature, because i'm using the function get_file_content that is within of class soc_message but the function get_file_content is universal 
                let file_content = await ftp_functions.get_file_content(); //this function retruns an array with all messages that are inside of xml file
              

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
                      decoded_code !== undefined && await stx_message.insert_on_tago(decoded_code, account_tago, Device, device[0].id, stu_message);
                      decoded_code !== undefined && await stx_message.delete_file_from_ftp(); 
    
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
  async function Decoding_analysis(context, scope) {console.log(scope)
      try{
          /* constants responsibles per access functions of tago.io */
          const envVars = Utils.envToJson(context.environment);
          const account = new Account({ token: envVars.account_token });


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
  
  module.exports = new Analysis(Decoding_analysis, { token: "850a5a75-c905-4d98-89d3-0e3155a71a9f" });



 

 