
class smart_one_c_message{
    contructor(hexadecimal_code){
       this.hexa_code = hexadecimal_code;
    }


    async get_file_content(xml_file_name, ftp_connection){

      let file_content = "hi";
      
       ftp_connection.get(`./${xml_file_name}`, function(err, stream) {
          
            if(err){ 
                throw err
            }else{
                stream.once('close', function() { ftp_connection.end(); });

                stream.on('data', (chunk) => {
                  file_content = file_content + chunk;console.log(file_content)

                  let there_is_content_within_of_file = file_content.includes("</payload>");
                  if(!there_is_content_within_of_file){ this.delete_file_from_ftp() };
               });     
            }

          return "file_content";
       });
       

      

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
 