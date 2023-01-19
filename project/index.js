//Dev: Kaique Yudji
//Date: 12/12/2022
//Before starts use this code, it's important read the readme file to know the objective this code.
//Purpose of this file: This file it's responsible per get the FTP server and send the files of server to the right algorithim. Each type of message of server(two types), needs of an algorithim specific

const { Analysis,Account, Utils, Services, Device } = require("@tago-io/sdk");
const Ftp_server = require("ftp");
const soc_messages = require('./classes/soc.js');



  /* this function will be the first to be called */
 async function Decoding_analysis(context, scope) {
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

                    if(err){ throw err;}
                    
                    if(file_list.length === 0){
                        connection.destroy();console.log("WITHOUT files in FTP");

                    }else{
                        console.log('reading files...')
                        Changing_algorithm(file_list,connection,account)
                    }
            
            })

        });

        connection.connect(access_config_ftp_server)
        

    }catch(err){
        console.log(err)
    }
  
 };
 
 module.exports = new Analysis(Decoding_analysis, { token: "a7925d96-99bc-4a70-b8f1-b7061a777dbd" });










 async function Changing_algorithm(file_list, ftp_connection, account_tago){

      /* Este é um code de baixa coesao.
      - Por que? 
      Esta função está com muitas responsabilidades, responsabilidades que não são suas por padrão. Seu objetivo é apenas escolher o algorítimo, mas ela está realizando consultas(Tago.IO), capturando dados(esn), para depois escolher o algorítimo
      */

       
        const cacth_esn = (data) =>{//what is ESN? Read in our README.
            let help = data.indexOf("<esn>");
            let firstTag = data.indexOf(">",help);
            let secondTag = data.indexOf("</esn>",firstTag);
            return data.substring(firstTag + 1,secondTag)
        };
           
        
            for await(let ftp_file of file_list){
                try{console.log(" ");console.log(ftp_file.name)
                    const smart_one_c_message = new soc_messages(ftp_file.name, ftp_connection);//here i need to fix the nomenclature, because i'm using the function get_file_content that is within of class soc_message but the function get_file_content is universal 
                    let file_content = await smart_one_c_message.get_file_content(); //this function retruns an array with all messages that are inside of xml file
                   

                   for await(let stu_message of file_content){
                      let esn_value = cacth_esn(stu_message); 
      
                      
                         let filter = { tags:[ {key:"ESN", value:esn_value} ]}
                         let device = await account_tago.devices.list({
                           page: 1,
                           filter,
                         })
                         
          
                         if( device[0].tags.find(tag => tag.key === 'TYPE' && tag.value === 'SOC') ){
                           let decoded_code = smart_one_c_message.decode(stu_message, esn_value);
                           decoded_code !== undefined && await smart_one_c_message.insert_on_tago(decoded_code, account_tago, Device, device[0].id);
                           //decoded_code !== undefined && await smart_one_c_message.delete_file_from_ftp(); 
                          
                           
                         }else if( device[0].tags.find(tag => tag.key === 'TYPE' && tag.value === 'STXX') ){
          
          
                         }else{
                           //provision algorithim
                         }
                  };
                  

                  
                    

                   
                }catch(err){
                  console.log(`Something went wrong  in the file${ftp_file.name}...`, err);continue
                }
                
                   
            }
    

    }//end of function
 

 