
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
                  stream.once('close', function() {});

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
         }, 2000)
       })
      
    }





    decode(hexa_code){

      const decode_lat = (latitude_hexadecimal_format) => {
        let hex_2_decimal = parseInt(latitude_hexadecimal_format,16); 

        let degree_per_count_lat = (90.0 / Math.pow(2,23)); 
        let latitude = hex_2_decimal * degree_per_count_lat > 90.0
                                   ? (hex_2_decimal * degree_per_count_lat) - 180
                                   : (hex_2_decimal * degree_per_count_lat); 
        return latitude;
      }


      const decode_lng = (longitude_hexadecimal_format) => {
        let hex_2_decimal = parseInt(longitude_hexadecimal_format,16); 

        let degree_per_count_long  = (180.0 / Math.pow(2,23));
        let longitude = hex_2_decimal * degree_per_count_long > 180 
                                    ? (hex_2_decimal * degree_per_count_long) - 360
                                    : (hex_2_decimal * degree_per_count_long); 
        return longitude;
      }







      function Default_Message(hexa_code){
         let latitude_hexadecimal_format = hexa_code.substring(2,8); 
         let longitude_hexadecimal_format = hexa_code.substring(8,14);

         const latitude = decode_lat(latitude_hexadecimal_format);
         const longitude = decode_lng(longitude_hexadecimal_format);
         
         let object_with_datas_to_insert_on_tago = { metadata:{} };

         let current_byte = "";
         let byte_array = new Array()

         for(let i= 0; i <= hexa_code.length; i++){
            current_byte += hexa_code[i];  

            if(current_byte.length === 2){
               byte_array.push(current_byte)//A byte is formated per 2 characters of code hexadecimal, therefore I added the byte equals the length of 2 characters the array of bytes. 
               let hex_2_bin = ("00000000" + (parseInt(current_byte, 16)).toString(2)).slice(-8);
              
               
                const decode_binary_code = ( ()=> {

                  if(byte_array.indexOf(current_byte) === 0){//here I'm decoding all the bits of first byte
                    for(let i = 0; i < hex_2_bin.length; i++ ){

                        if(i === 2 && hex_2_bin[i] === 0){//the variable i matches the position of bit
                           object_with_datas_to_insert_on_tago["metadata"]["batery"] = "Bateria em bom estado";
                        } else{
                           object_with_datas_to_insert_on_tago["metadata"]["batery"] = "Subistituir Pilhas";
                        }

                        if(i === 3 && hex_2_bin[i] === 0){
                           object_with_datas_to_insert_on_tago["metadata"]["valid_data_from_gps"]= "Dados de GPS válidos nesta mensagem";
                        } else{
                           object_with_datas_to_insert_on_tago["metadata"]["valid_data_from_gps"] = " Falha no GPS neste ciclo de mensagem, ignorar campos de Latitude e Longitude";
                        }

                        if(i === 4 && hex_2_bin[i] === 1){
                           object_with_datas_to_insert_on_tago["metadata"]["missed_input_1"]= true;
                        } else{}

                        if(i === 5 && hex_2_bin[i] === 1){
                           object_with_datas_to_insert_on_tago["metadata"]["missed_input_2"] = true;
                        } else{}

                        if(i === 7){
                           let binary_code = hex_2_bin[6] + hex_2_bin[7];
                           let bin_2_decimal = parseInt(binary_code,2);
                           
                           object_with_datas_to_insert_on_tago["metadata"]["gps_fail_counter"] = bin_2_decimal;
                        } else{}

                    }


                  }else if(byte_array.indexOf(current_byte) === 7){//here i'm decodinf the bist of byte of position 7
                    console.log(current_byte, hex_2_bin)

                  }else if(byte_array.indexOf(current_byte) === 8){//here i'm decodinf the bist of byte of position  8
                    console.log(current_byte, hex_2_bin)

                  }
                 
               }) () //end of function 

            

               hex_2_bin = "";
               current_byte = "";
            }
         } //end of for





      }  







      function Truncate_Message(hexa_code){

      }







      function type3_Message(hexa_code){//the type 3 can has many diffrents types of message, we can differentiate the messages trough of subtypes.

      }

      



      

      hexa_code.forEach(stu_message => {//A stu message matches the each message has sent of device that is inside of my xml file. /FOR MORE INFORMATION ABOU THE XML FILE, ACCESS OUR README/
         let help = stu_message.indexOf("<payload");
         let firstTag = stu_message.indexOf(">",help);
         let secondTag = stu_message.indexOf("</payload>",firstTag);
         let hexa_code= stu_message.substring(firstTag + 3,secondTag);

         const find_out_type_of_message = ( () => {//The GlobalStar has 3 differents types of messages: Default Message, Diagnostic Message, StoreCount Message, we can know the typeof message trough of first byte.
            let byte_that_countains_the_type_of_message = hexa_code.substring(0,2);
            let hex_2_bin = ("00000000" + (parseInt(byte_that_countains_the_type_of_message, 16)).toString(2));
            let bin_2_decimal = parseInt(hex_2_bin.substring(0,2),2);//I'm cutting the string(hex_to_bin) because i need just of two first bits to define the type of my message;
                
                if(bin_2_decimal === 0){
                  Default_Message(hexa_code);

               }else if(bin_2_decimal === 1){
                  Truncate_Message(hexa_code);

               }else{
                  type3_Message(hexa_code);

               } 
         } )()


      });//end of foreach

    }






    delete_file_from_ftp(xml_content, xml_name){
        
    }
    





    insert_on_tago(handled_data){
        console.log('teste');
    }
 }


 module.exports = smart_one_c_message;
 