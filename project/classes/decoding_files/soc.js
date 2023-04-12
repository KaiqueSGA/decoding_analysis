/*  
  Dev: Kaique YUdji
  Date:27/12/2022
  Code description: In this file, i'm decoding the xml files storaged per the ftp server. 
  This code will insert on TAGO.IO the field with its binary value so then the TAGO.IO payload finish of decode the values.
*/


class smart_one_c_message{

    decode(file_content, esn_value){//public method

        let hexa_code = this.get_hexa_code_from_ftp_file(file_content);

        //The GlobalStar has 3 differents types of messages: Default Message, Diagnostic Message and StoreCount Message. We can find out the type of message through of first byte.
        let byte_that_countains_the_type_of_message = hexa_code.substring(0,2);
        let hex_2_bin = ("00000000" + (parseInt(byte_that_countains_the_type_of_message, 16)).toString(2)).slice(-8);
          

        const catch_unix_time = () => {

            // the indexOf function will return the first position of string:"<unixTime>". In other words, the positio of: "<". Therefore i need to add 10 the response this function, add 10 the response, the code will catch the first position of my unixtime value 
            let identify_tag_unix_time = file_content.indexOf("<unixTime>") + 10;
            let unix_time_value = file_content.substring(identify_tag_unix_time, file_content.indexOf("</unixTime>"));
            return unix_time_value;

        }


        if(byte_that_countains_the_type_of_message === "02"){console.log("raw message",  byte_that_countains_the_type_of_message)
          //return this.Decode_default_message(hexa_code,  esn_value);

        }else if(hex_2_bin[7] === "0"){console.log("default message (atlasTrax)", byte_that_countains_the_type_of_message)
          return this.Decode_default_message(hexa_code, esn_value, catch_unix_time());

        }else if(hex_2_bin[7] === "1"){console.log("type3", byte_that_countains_the_type_of_message)
          return this.Decode_type3_message(hexa_code, esn_value, catch_unix_time());
        } 


    }








     // hexa_code --> From this parameter we're going to get the values sent by device , esn_value --> device identifier;
     //This method will return an object with the fields and its binary values;
     Decode_default_message(hexa_code, esn_value, unix_time){//private method
        
        const latitude = this.decode_lat(hexa_code.substring(2,8));
        const longitude = this.decode_lng(hexa_code.substring(8,14));
        

        let object_with_datas_to_insert_on_tago = { variable:"ESN", value: esn_value, location:{ type:"Point", coordinates:[longitude,latitude] }, metadata:{ message_type:0, device_type:"SOC", url_pin: {url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, alias: `Open map at ${latitude},${longitude}`}} }; //this object will be filled during of decoding of bits of each byte
        
        /* Variable that i'm going to use to decode the values of the byte  */
        let current_byte = "";
        let byte_array = new Array();



        /* Each field of this object is formated per 2 characters. The first: Byte position, The second: Binary position. Through of byte position and of binary position we can identify its value */
        let value_of_each_bit = {  
          
          "00": (binary_value) => { return {message_type:binary_value} }, 
          
          "01": (binary_value) => { return {input_2:binary_value} },//0 --> Closed, 1 --> Opened
          
          "02": (binary_value) => { return {input_1:binary_value} },//0 --> Closed, 1 --> Opened
          
          "03": (binary_value) => { return {external_power:binary_value} },//0 --> Battery, 1 --> Ext.Pwr
          
          "04": (binary_value) => { return {vibration:binary_value} },//0 --> Steady, 1 --> in Vibration 
          
          "07": (current_byte_2_bin) => { let cardinal_direction = parseInt(current_byte_2_bin.substring(5),2);  return {bearing: cardinal_direction } } , 
          
          "70": (current_byte_2_bin) => { return {speed:parseInt(current_byte_2_bin,2)} } ,//0 --> Didn't trigger the message, 1 --> Triggered message
          
          "86": (current_byte_2_bin) => {
              let gps_value = parseInt(current_byte_2_bin.substring(1,8),2); 

              let utc_time = new Date(unix_time * 1000); 
              let utc_date = new Date(utc_time); 


              let gw_seconds = (utc_time.getUTCHours() * 3600 + utc_time.getUTCMinutes() * 60 + utc_time.getUTCSeconds());// --> unixtime value

              let gps_seconds = (gps_value * 6) ;// --> multiplico o valor do gps por 6 pois quando o tempo foi codificado pelo device, o valor foi dividido por 6 para encaixar dentro de 6 bits 

              let gw_chunk = parseInt(gw_seconds / 720);

              let gps_time = ( (gw_chunk * 720) + gps_seconds ) * 1000;//descobrindo o valor do meu chunk dentro do unixtime

              let result_time = new Date(gps_time); 

              let result_date_time = new Date(utc_date.getFullYear(), utc_date.getMonth(), utc_date.getDate(), result_time.getHours(), result_time.getMinutes(), result_time.getSeconds()) 
              
              if (result_date_time > utc_time) result_date_time = utc_time;
              

             return {time:result_date_time};
           },
          
          "87": (binary_value) => { return {batery_change:binary_value} } //0 --> Good, 1 --> Replace
        }




          for(let i= 0; i < hexa_code.length; i++){//This for it's responsible per "passing" per all bytes of my message
            current_byte += hexa_code[i];
          
            if(current_byte.length === 2){//A byte is formated per 2 characters of code hexadecimal, therefore I added the byte equals the length of 2 characters the array of bytes.
              byte_array.push(current_byte) 
              let current_byte_2_bin = ("00000000" + (parseInt(current_byte, 16)).toString(2)).slice(-8);

              
                const decode_binary_code = ( ()=> { 
                
                    for(let i = 0; i < current_byte_2_bin.length; i++ ){
                      let values = `${byte_array.indexOf(current_byte)}${i}`;//0 ==> byte position, 0 ==> binary position

                      values !== "00"                                              
                                        && ( () => {

                                            let bit_value = typeof(value_of_each_bit[values]) === "function"  
                                                                              ? value_of_each_bit[values]( values === "07" || values === "70" || values === "86" ? current_byte_2_bin : Number(current_byte_2_bin.split("").reverse().join("")[i]))//Aqui eu  estou invertando os bits para que a posição "1" do manual seja de fato a posição 1   
                                                                              : undefined;

                                            
                                              if(bit_value !== undefined){
                                                Object.assign(object_with_datas_to_insert_on_tago.metadata, bit_value);                              
                                              }

                                          } )()


                      values = ""; 

                    }
               }) () 


          
              current_byte_2_bin = "";
              current_byte = "";
            } 

        } //end of for 
        
        
        object_with_datas_to_insert_on_tago.metadata.lat = latitude;
        object_with_datas_to_insert_on_tago.metadata.lon = longitude;

        return object_with_datas_to_insert_on_tago;
    }  









     //It receives 2 parameters: hexa_code --> From this parameter we're going to get the values sent by device , esn_value --> device identifier;
     //This method will return an object with the fields and its binary values;
     Decode_truncate_message(hexa_code, esn_value){//private method
        
          const latitude = this.decode_lat(`${hexa_code.substring(2,4)}${hexa_code.substring(4,6)}${hexa_code.substring(6,8)}`);
          const longitude = this.decode_lng(`${hexa_code.substring(8,10)}${hexa_code.substring(10,12)}${hexa_code.substring(12,14)}`);

          let object_with_datas_to_insert_on_tago = { variable:"ESN", value: esn_value, location:{ type:"Point", coordinates:[longitude, latitude] }, metadata:{ message_type:1, sub_type:0, device_type:"SOC", lat:latitude, lon:longitude, url_pin: {url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, alias: `Open map at ${latitude},${longitude}`} } };
          let hex_2_bin = ("00000000" + (parseInt(hexa_code.substring(0,2), 16)).toString(2)).slice(-8);

         /* in this code block I'm assigning values to the response object*/
          hexa_code.length === 18 ? object_with_datas_to_insert_on_tago.metadata.sub_type = 0 : object_with_datas_to_insert_on_tago.metadata.sub_type = 1
          object_with_datas_to_insert_on_tago.metadata.user_data = hexa_code.substring(14); 
          object_with_datas_to_insert_on_tago.metadata.submask_data = parseInt(hex_2_bin.substring(2),2);

          return object_with_datas_to_insert_on_tago;
    }











   Decode_type3_message(hexa_code, esn_value){//private method
        let object_with_datas_to_insert_on_tago = { variable:"ESN", value: esn_value, metadata:{message_type:3,  device_type:"SOC"} };

     //this code needs to be fixed, instead of convert to binary and after convert to deciaml, my code is going to convert direct of hex to decimal
        if(subtype()){
            if(subtype() === "DIAGNOSTIC MESSAGE"){console.log("diagnostic")
              return decode_diagnostic_message("diagnosticMessage");
            
            }else if(subtype() === "REPLACE BATERY"){console.log("replace")
              return decode_diagnostic_message("bateryMessage");//The replace battery message has a format almost identical to the diagnostic message. Therefore I Can use the same function to decode the content
            
            }else if(subtype() === "CONTACT SERVICE PROVIDER MESSAGE"){
              return {provider_message: hexa_code, metadata:{message_type:3, sub_type:""}};

            }else if(subtype() === "ACCUMULATE/COUNT MESSAGE"){console.log("accumulate")
              return AccumulateCountMessage();

            }
      }




        function decode_diagnostic_message(subtype){
            let byte_array = new Array();
            let current_byte = "";

            
              for(let i= 0; i < hexa_code.length; i++){
                    current_byte += hexa_code[i];

                    if(current_byte.length === 2){
                      byte_array.push(current_byte);
                      let current_byte_2_bin = ("00000000" + (parseInt(current_byte, 16)).toString(2)).slice(-8);
                      let value_of_each_bit = { "103":() => {  return { number_of_transmissions:parseInt(current_byte_2_bin[0] + current_byte_2_bin[1] + current_byte_2_bin[2] + current_byte_2_bin[3], 2)}  },   "113":()=>{ return { number_of_transmissions:parseInt(current_byte_2_bin[0] + current_byte_2_bin[1] + current_byte_2_bin[2] + current_byte_2_bin[3], 2)}  },           "104": {battery_condition:"Good batery"}, "114":{battery_condition:"Replace batery"},             "105":{gps_subsystem_fault: "GPS system OK."}, "115":{gps_subsystem_fault: "Fault"},             "106":{transmitter_subsystem_fault: "Trasnmitter OK."}, "116":{transmitter_subsystem_fault: "Fault"},             "107":{scheduler_subsystem_fault: "Transmitter OK."}, "117":{scheduler_subsystem_fault: "Fault"},        "2":() => {  return { min_interval:parseInt(current_byte_2_bin,2) }  },          "3": () => {  return {max_interval:parseInt(current_byte_2_bin,2)}  },     "4":() => { return {gps_mean_search_time:parseInt(current_byte_2_bin,2)} },       "6":() => { let byte5_2_bin = ("00000000" + (parseInt(byte_array[5], 16)).toString(2)).slice(-8);  let byte6_to_bin = ("00000000" + (parseInt(byte_array[6], 16)).toString(2)).slice(-8);     return { gps_fails:parseInt(byte5_2_bin,2) + parseInt(byte6_to_bin,2)}  },       "8":() => { let byte7_2_bin = ("00000000" + (parseInt(byte_array[7], 16)).toString(2)).slice(-8);  let byte8_to_bin = ("00000000" + (parseInt(byte_array[8], 16)).toString(2)).slice(-8);     return { transmission_numbers: (parseInt(byte7_2_bin,2) + parseInt(byte8_to_bin,2)) }  }   }

                        
                        if(byte_array.indexOf(current_byte) !== 0){

                              if(byte_array.indexOf(current_byte) === 1){

                                for(let i = 0; i < current_byte_2_bin.length; i++){
                                  let values = `${byte_array.indexOf(current_byte)}${current_byte_2_bin[i]}${i}`;//0 ==> byte position, 0 ==> binary value, 0 ==> binary position
                                  let bit_value = typeof(value_of_each_bit[values]) === "function"  ?value_of_each_bit[values]()  :value_of_each_bit[values];

                                    if(bit_value !== undefined){
                                      Object.assign(object_with_datas_to_insert_on_tago.metadata, bit_value);                              
                                    }
                                    
                                    values = ""; 
                                }
                              

                              }else if(byte_array.indexOf(current_byte) === 2){
                                Object.assign(object_with_datas_to_insert_on_tago.metadata ,value_of_each_bit["2"]());

                              }else if(byte_array.indexOf(current_byte) === 3){
                                Object.assign(object_with_datas_to_insert_on_tago.metadata ,value_of_each_bit["3"]());

                              }else if(byte_array.indexOf(current_byte) === 4){
                                Object.assign(object_with_datas_to_insert_on_tago.metadata ,value_of_each_bit["4"]());

                              }else if(byte_array.indexOf(current_byte) === 6){
                                Object.assign(object_with_datas_to_insert_on_tago.metadata ,value_of_each_bit["6"]());//BYTE 5 and 6

                              }else if(byte_array.indexOf(current_byte) === 8){
                                Object.assign(object_with_datas_to_insert_on_tago.metadata ,value_of_each_bit["8"]());//BYTE 7 and 8

                              }

                        } 


                        current_byte_2_bin = "";
                        current_byte = "";
                    }

                }


 
                subtype === "diagnosticMessage"
                             ?object_with_datas_to_insert_on_tago.metadata.sub_type = "diagnosticMessage"
                             :object_with_datas_to_insert_on_tago.metadata.sub_type = "bateryMessage";

                return object_with_datas_to_insert_on_tago;
                
              }


          



            function AccumulateCountMessage(){
               let byte_array = new Array();
               let current_byte= "";

               for(let i = 0; i < hexa_code.length; i++){
                 current_byte += hexa_code[i];

                 if(current_byte.length === 2){//estou multiplicando os valores por 10 pq eu quero o tempo em minutos
                    byte_array.push(current_byte);
                    let value_of_each_bit = { "1":() => {  if(hexa_code.substring(2,4) === "FFFF"){ return {entry_1_stored:"Turn entry 1 storage off"} }else{ return {entry_1_stored: ( (parseInt(hexa_code.substring(0,4), 16)) * 10 ) }}  },    "3":() => {  if(hexa_code.substring(2,4) === "FFFF"){ return {entry_2_stored:"Turn entry 1 storage off"} }else{ return { entry_2_stored: ( (parseInt(hexa_code.substring(4,8), 16)) * 10 )} }  }, "5":{ storage_vibration: ( (parseInt(hexa_code.substring(8,12),16)) * 10 )}, "7":() => { if(hexa_code.substring(0,2) === "FF"){ return {entry_count_1:"off"}  }else{ return{entry_count_1:( parseInt(hexa_code.substring(12,14),16) )} }  }, "8":() => { if(hexa_code.substring(0,2) === "FF"){ return {entry_count_2:"off"}  }else{ return{entry_count_2:( parseInt(hexa_code.substring(14,16),16) )} }  } }
                    
                    let bit_value = typeof(value_of_each_bit[byte_array.indexOf(current_byte).toString()]) === "function"  ?value_of_each_bit[byte_array.indexOf(current_byte).toString()]()  :value_of_each_bit[byte_array.indexOf(current_byte).toString()];
                        
                    byte_array.indexOf(current_byte) === 1 // 1 and 2 byte
                    ? Object.assign(object_with_datas_to_insert_on_tago.metadata, bit_value)

                    :byte_array.indexOf(current_byte) === 3 // 3 and 4 byte 
                    ? Object.assign(object_with_datas_to_insert_on_tago.metadata, bit_value)

                    :byte_array.indexOf(current_byte) === 5 // 5 and 6 byte
                    ? Object.assign(object_with_datas_to_insert_on_tago.metadata, bit_value)   

                    :byte_array.indexOf(current_byte) === 7 
                    ? Object.assign(object_with_datas_to_insert_on_tago.metadata, bit_value) 

                    :byte_array.indexOf(current_byte) === 8 
                    && Object.assign(object_with_datas_to_insert_on_tago.metadata, bit_value);


                    current_byte = "";
                 }

               }

               object_with_datas_to_insert_on_tago.metadata.sub_type = "accumulateMessage";
               return object_with_datas_to_insert_on_tago;
            }






          function subtype(){
              let byte_that_countains_the_subtype_of_message = hexa_code.substring(0,2); 
              let hex_2_bin = ("00000000" + (parseInt(byte_that_countains_the_subtype_of_message, 16)).toString(2)).slice(-8); 
              let response; 


              parseInt(hex_2_bin.substring(2,8),2) === 21 && ( () => { response = "DIAGNOSTIC MESSAGE"} )();
              parseInt(hex_2_bin.substring(2,8),2) === 22 && ( () => { response = "REPLACE BATERY"} )();
              parseInt(hex_2_bin.substring(2,8),2) === 23 && ( () => { response = "CONTACT SERVICE PROVIDER MESSAGE"} )();
              parseInt(hex_2_bin.substring(2,8),2) === 24 && ( () => {response = "ACCUMULATE/COUNT MESSAGE"} )();
              
              return response;
          }
          
          
    }//end of method 



    







    decode_lat(latitude_hexadecimal_format){//private method
      let hex_2_decimal = parseInt(latitude_hexadecimal_format,16); 

      let degree_per_count_lat = (90.0 / Math.pow(2,23)); 
      let latitude = hex_2_decimal * degree_per_count_lat > 90.0
                                  ? (hex_2_decimal * degree_per_count_lat) - 180
                                  : (hex_2_decimal * degree_per_count_lat); 
      return latitude;
    }

    


    decode_lng(longitude_hexadecimal_format){//private method
      let hex_2_decimal = parseInt(longitude_hexadecimal_format,16); 

      let degree_per_count_long  = (180.0 / Math.pow(2,23));
      let longitude = hex_2_decimal * degree_per_count_long > 180 
                                  ? (hex_2_decimal * degree_per_count_long) - 360
                                  : (hex_2_decimal * degree_per_count_long); 
      return longitude;
    }




    get_hexa_code_from_ftp_file(stu_message){//private method
      try{
        let firstTag = stu_message.indexOf(">", stu_message.indexOf("<payload"));
        let secondTag = stu_message.indexOf("</payload>", firstTag);
        return stu_message.substring(firstTag + 3,secondTag);

      }catch(err){
         console.error(`wasn't possible to get the file content. ${err}`)
      }
      
    }



 }



 module.exports = smart_one_c_message;
 