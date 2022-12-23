
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






     decode(file_content){

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





      const get_hexa_code_from_ftp_file = (stu_message) => {
         let firstTag = stu_message.indexOf(">", stu_message.indexOf("<payload"));
         let secondTag = stu_message.indexOf("</payload>", firstTag);
         return stu_message.substring(firstTag + 3,secondTag);
      }


      file_content.forEach(stu_message => {//A stu message(inside os a xml file i can have more than one stu_message) matches the each message has sent of device that is inside of my xml file. /FOR MORE INFORMATION ABOU THE XML FILE, ACCESS OUR README/
         let hexa_code = get_hexa_code_from_ftp_file(stu_message);

         const find_out_type_of_message = ( () => {//The GlobalStar has 3 differents types of messages: Default Message, Diagnostic Message, StoreCount Message, we can know the typeof message through of first byte.
            let byte_that_countains_the_type_of_message = hexa_code.substring(0,2);
            let hex_2_bin = ("00000000" + (parseInt(byte_that_countains_the_type_of_message, 16)).toString(2));
            let bin_2_decimal = parseInt(hex_2_bin.substring(0,2),2);//I'm cutting the string(hex_to_bin) because i need just of two first bits to define the type of my message;
                
                if(bin_2_decimal === 0){
                 return Default_Message(hexa_code);

               }else if(bin_2_decimal === 1){
                 return Truncate_Message(hexa_code);

               }else{
                 return type3_Message(hexa_code);

               } 
         } )()


      });//end of foreach







      function Default_Message(hexa_code){console.log(hexa_code)
         let latitude_hexadecimal_format = hexa_code.substring(2,8); 
         let longitude_hexadecimal_format = hexa_code.substring(8,14);

         const latitude = decode_lat(latitude_hexadecimal_format);
         const longitude = decode_lng(longitude_hexadecimal_format);
         

         let object_with_datas_to_insert_on_tago = { coordinates:[latitude,longitude], metadata:{} }; //this object will be filled during of decoding of bits of each byte
         let current_byte = "";
         let byte_array = new Array()

          for(let i= 0; i < hexa_code.length; i++){
            current_byte += hexa_code[i];
           
             if(current_byte.length === 2){
               byte_array.push(current_byte)//A byte is formated per 2 characters of code hexadecimal, therefore I added the byte equals the length of 2 characters the array of bytes. 
               let hex_2_bin = ("00000000" + (parseInt(current_byte, 16)).toString(2)).slice(-8);
              
            
                const decode_binary_code = ( ()=> {

                  if(byte_array.indexOf(current_byte) === 0){//here I'm decoding all the bits of first byte
                     for(let i = 0; i < hex_2_bin.length; i++ ){

                           if(i == 2 && hex_2_bin[i] == 0){//the variable i matches the position of bit
                              object_with_datas_to_insert_on_tago["metadata"]["batery"] = "Bateria em bom estado";
                           } 
                           else if(i == 2 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["batery"] = "Subistituir Pilhas";
                           }




                           else if(i == 3 && hex_2_bin[i] == 0){
                              object_with_datas_to_insert_on_tago["metadata"]["valid_data_from_gps"] = "Dados de GPS válidos nesta mensagem";
                           }
                           else if(i == 3 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["valid_data_from_gps"] = " Falha no GPS neste ciclo de mensagem, ignorar campos de Latitude e Longitude";
                           }



                           else if(i == 4 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["missed_input_1"]= true;
                           } 



                           else if(i == 5 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["missed_input_2"] = true;
                           } 



                           else if(i == 7){
                              let binary_code = hex_2_bin[6] + hex_2_bin[7];
                              let bin_2_decimal = parseInt(binary_code,2);
                              
                              object_with_datas_to_insert_on_tago["metadata"]["gps_fail_counter"] = bin_2_decimal;
                           } 

                     }
                   

                  }else if(byte_array.indexOf(current_byte) === 7){//here i'm decoding the bits of byte of position 7
                     for(let i = 0; i < hex_2_bin.length; i++){
                        
                           if(i == 0 && hex_2_bin[i] == 0){
                              object_with_datas_to_insert_on_tago["metadata"]["input1_change"] = "message didn't trigger";
                           }
                           else if(i == 0 && hex_2_bin[i] == 1){ 
                              object_with_datas_to_insert_on_tago["metadata"]["input1_change"] = "triggered message";
                           }



                           else if(i == 1 && hex_2_bin[i] == 0){
                              object_with_datas_to_insert_on_tago["metadata"]["input1_state"] = "closed";
                           }
                           else if(i == 1 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["input1_state"] = "open";
                           }


                           
                           else if(i == 2 && hex_2_bin[i] == 0){
                              object_with_datas_to_insert_on_tago["metadata"]["input2_change"] = "didn't trigger";
                           }
                           else if(i == 2 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["input2_change"] = "triggered message";
                           }



                           else if(i == 3 && hex_2_bin == 0){
                              object_with_datas_to_insert_on_tago["metadata"]["input2_state"] = "closed";
                           }
                           else if(i == 3 && hex_2_bin == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["input2_state"] = "open";
                           }

                           
                     }

                     
                  } else if(byte_array.indexOf(current_byte) == 8){//here i'm decoding the bits of byte of position  8
                       for(let i = 0; i < hex_2_bin.length; i++){

                           if(i == 3 && hex_2_bin[i] == 0){
                              //speak with celio about this field.
                           }
                           else if(i == 3 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["vibration_state_changed"] = true;
                           }



                           else if(i == 4 && hex_2_bin[i] == 0){
                              object_with_datas_to_insert_on_tago["metadata"]["vibration"] = false;
                           }
                           else if(i == 4 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["vibration"] = true;
                           }



                           else if(i == 5 && hex_2_bin[i] == 0){
                              object_with_datas_to_insert_on_tago["metadata"]["type_location"] = "3D";
                           }
                           else if(i == 5 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["type_location"] = "2D";
                           }



                           else if(i == 6 && hex_2_bin[i] == 0){
                              object_with_datas_to_insert_on_tago["metadata"]["in_motion"] = false;
                           }
                           else if(i == 6 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["in_motion"] = true;
                           }



                           else if(i == 7 && hex_2_bin[i] == 0){
                              object_with_datas_to_insert_on_tago["metadata"]["in_motion"] = false;
                           }
                           else if(i == 7 && hex_2_bin[i] == 1){
                              object_with_datas_to_insert_on_tago["metadata"]["in_motion"] = true;
                           }

                     }

                  } 
                 
               }) () //end of function 

            

               hex_2_bin = "";
               current_byte = "";
            } 
         } //end of for 
        
        console.log(object_with_datas_to_insert_on_tago, " ", " ");
      }  







      function Truncate_Message(hexa_code){

      }







      function type3_Message(hexa_code){//the type 3 can has many diffrents types of message, we can differentiate the messages trough of subtypes.

      }


    }






    delete_file_from_ftp(xml_content, xml_name){
        
    }
    





    insert_on_tago(handled_data){
        console.log('teste');
    }
 }


 module.exports = smart_one_c_message;
 