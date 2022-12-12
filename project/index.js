//Dev: Kaique Yudji
//Date: 12/12/2022
//Before starts use this code, it's important read the readme file to know the objective this code.
//Purpose of this file: This file it's responsible per get the FTP server and send the files of server to the right algorithim. Each type of message of server(two types), needs of an algorithim specific

 const { Analysis,Account, Utils, Services } = require("@tago-io/sdk");
 const Ftp_server = require("ftp");
 const soc_messages = require('./auxiliar_classes/soc_data_class/soc.js');


   /* this function will define the code's algorithim */
  function ChangingAlgorithm(array){
        
        array.forEach((item) => {  
            if(item.name.startsWith("StuMessages")){

                    module.exports = {
                        account:account,
                        ftpConnect:c
                    };

                    xmlFuncs(item.name);

            }else if(item.name.startsWith("ProvisionMessages")){

                    module.exports = {
                        ftpConnect:c
                    };

                    provFuncs.completeAlgorithim(item.name);

            }else if(item.name.startsWith("SOC")){

                    module.exports = {
                        ftpConnect:c
                    };

                    provFuncs.completeAlgorithim(item.name);

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

            connection.list("*.xml", function(err,list){

                    if(err){ throw err;}
                    
                    if(list.length === 0){
                        connection.destroy();console.log("WITHOUT files in FTP");

                    }else{
                        console.log('reading files...')
                        ChangingAlgorithm(list)
                    }
            
            })//end of function connection.list

        });//end of function connection.on

        //connection.connect(config)

        console.log(soc_messages.insert_on_tago())
        
        





    }catch(err){
        console.log(err)
    }
  
 };
 
 module.exports = new Analysis(Decoding_analysis, { token: "a7925d96-99bc-4a70-b8f1-b7061a777dbd" });
 

 