
class smart_one_c_message{
    constructor(hexadecimal_code){
       this.hexa_code = hexadecimal_code;
    }


    async get_file_content(xml_file_name, ftp_connection){
      let array_of_content = new Array();
      let file_content;
      
       await ftp_connection.get(`./${xml_file_name}`, async function(err, stream) {
          
            if(err){ 
                throw err
            }else{
                  stream.once('close', function() { ftp_connection.end(); });

                 await stream.on('data', (chunk) => {
                  file_content = "";
                  file_content = file_content + chunk;
                  array_of_content.push(file_content);

                  let there_is_content_within_of_file = file_content.includes("</payload>");
                  if(!there_is_content_within_of_file){ this.delete_file_from_ftp() };
               });     

            }
            
       });

       return new Promise((resolve, reject) => {
         setTimeout(() => {
            return resolve(array_of_content);
         }, 1000)
       })
      
    }


    decode(hexa_code){


    }

    delete_file_from_ftp(xml_content, xml_name){
        
    }
    

    insert_on_tago(handled_data){
        console.log('teste');
    }
 }


 module.exports = smart_one_c_message;
 