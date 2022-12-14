//Dev: Kaique Yudji
//Date: 12/12/2022
//Before starts use this code, it's important read the readme file to know the objective this code.
//Purpose of this file: This file it's responsible per get the FTP server and send the files of server to the right algorithim. Each type of message of server(two types), needs of an algorithim specific

const { Analysis,Account, Utils, Services } = require("@tago-io/sdk");
const { default: ConsoleService } = require("@tago-io/sdk/out/modules/Services/Console.js");
const Ftp_server = require("ftp");
const soc_messages = require('./classes/soc_data_class/soc.js');


   /* this function will define the code's algorithim */
 async function Changing_algorithm(file_list, ftp_connection){
        
    file_list.forEach( async(ftp_file) => {  
            if(ftp_file.name.startsWith("StuMessages")){

                    /* module.exports = {
                        account:account,
                        ftpConnect:c
                    };

                    xmlFuncs(item.name); */

            }else if(ftp_file.name.startsWith("ProvisionMessages")){

                   /*  module.exports = {
                        ftpConnect:c
                    };

                    provFuncs.completeAlgorithim(item.name); */

            }else if(ftp_file.name.startsWith("SOC")){

                   const smart_one_c_message = new soc_messages();
                   let content_file = await smart_one_c_message.get_file_content(ftp_file.name, ftp_connection);
                   console.log(content_file[0]);
                    

            }
            
        })//end of for


    }//end of function





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
                        Changing_algorithm(file_list,connection)
                    }
            
            })//end of function connection.list

        });//end of function connection.on

        connection.connect(access_config_ftp_server)
        

    }catch(err){
        console.log(err)
    }
  
 };
 
 module.exports = new Analysis(Decoding_analysis, { token: "a7925d96-99bc-4a70-b8f1-b7061a777dbd" });
 

 