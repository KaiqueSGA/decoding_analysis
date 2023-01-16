//Dev: Kaique YUdji
//Date:27/12/2022
//Code description: In this file, i'm decoding the xml files storaged per the ftp server. The code that I created is first creating all function and after call them

const ftp_and_tago_function = require("./ftp_and_tago_functions");




class smart_one_c_message extends ftp_and_tago_function {

  constructor(xml_file_name, ftp_connection){
    super(xml_file_name, ftp_connection);
  }


    decode(file_content, esn_value){//public method

        let hexa_code = this.get_hexa_code_from_ftp_file(file_content);

        //The GlobalStar has 3 differents types of messages: Default Message, Diagnostic Message and StoreCount Message. We can find out the typeof message through of first byte.
        let byte_that_countains_the_type_of_message = hexa_code.substring(0,2);
        let hex_2_bin = ("00000000" + (parseInt(byte_that_countains_the_type_of_message, 16)).toString(2)).slice(-8);
        let bin_2_decimal = parseInt(hex_2_bin.substring(0,2),2);//I'm cutting the string(hex_to_bin) because i need just of two first bits to define the type of my message;
                    

        if(bin_2_decimal === 0){console.log("default")
          return this.Decode_default_message(hexa_code,  esn_value);

        }else if(bin_2_decimal === 1){
          return this.Decode_truncate_message(hexa_code, esn_value);

        }else if(bin_2_decimal === 3){console.log("type3")
          return this.Decode_type3_message(hexa_code, esn_value);
        } 


    }










     Decode_default_message(hexa_code, esn_value){//private method
        
        const latitude = this.decode_lat(hexa_code.substring(2,8));
        const longitude = this.decode_lng(hexa_code.substring(8,14));
        

        let object_with_datas_to_insert_on_tago = { variable:"ESN", value: esn_value, location:{ type:"Point", coordinates:[longitude,latitude] }, metadata:{} }; //this object will be filled during of decoding of bits of each byte
        let current_byte = "";
        let byte_array = new Array();

          for(let i= 0; i < hexa_code.length; i++){
            current_byte += hexa_code[i];
          
            if(current_byte.length === 2){
              byte_array.push(current_byte)//A byte is formated per 2 characters of code hexadecimal, therefore I added the byte equals the length of 2 characters the array of bytes. 
              let current_byte_2_bin = ("00000000" + (parseInt(current_byte, 16)).toString(2)).slice(-8);
              let value_of_each_bit = {  "002":{batery:"Good Batery"}, "012":{batery:"replace batery"},    "003":{gps_data:"GPS Data valid"},"013":{gps_data:"GPS Data wrong"},    "014":{missed_input1:true},"015":{missed_input2:true},   "006":"","016":"",   "007":( () => { let binary_code = current_byte_2_bin[6] + current_byte_2_bin[7];   let bin_2_decimal = parseInt(binary_code,2);    object_with_datas_to_insert_on_tago["metadata"]["gps_fail_counter"] = bin_2_decimal; } )(),  "017":( () => { let binary_code = current_byte_2_bin[6] + current_byte_2_bin[7];   let bin_2_decimal = parseInt(binary_code,2);    object_with_datas_to_insert_on_tago["metadata"]["gps_fail_counter"] = bin_2_decimal; } )(),   "700":{input1_change:"Did not trigger message"},"710":{input1_change:"Triggered message"},   "701":{input1_state:"closed"},"711":{input1_state:"open"},   "702":{input2_change:"Did not trigger message"},"712":{input2_change:"Triggered message"},   "703":{Input2_state:"closed"},"713":{Input2_state:"open"},   "704":"","714":"","705":"","715":"","706":"","716":"","707":( () => {})(), "717": (() => { let binary_code = current_byte_2_bin[4] + current_byte_2_bin[5] + current_byte_2_bin[6] + current_byte_2_bin[7];  let bin_2_decimal = parseInt(binary_code,2);  bin_2_decimal === 0 ?object_with_datas_to_insert_on_tago["metadata"]["sub_type"] = "location message" : bin_2_decimal === 1 ?object_with_datas_to_insert_on_tago["metadata"]["sub_type"] = "Device Turned on Message" : bin_2_decimal === 2 ? object_with_datas_to_insert_on_tago["metadata"]["sub_type"] = "Change of location area alert message" :  bin_2_decimal === 3 ? object_with_datas_to_insert_on_tago["metadata"]["sub_type"] = "Input status changed message" : bin_2_decimal === 4 ? object_with_datas_to_insert_on_tago["metadata"]["sub_type"] = "undesired input state message" :object_with_datas_to_insert_on_tago["metadata"]["sub_type"]="re-centering message" })(),    "803":{vibration_state_changed:"This message is being transmitted for a reason other than the above reasons"},"813":{vibration_state_changed:"vibration just changed state"},   "804":{vibration_Unit:"is not in a state of vibration"},"814":{vibration_Unit:"Unit is in a state of vibration"},   "805":{type_location:"GPS data reported is from a 3D fix"},"815":{type_location:"GPS data reported is from a 2D fix"},   "806":{in_motion:false},   "816":{in_motion:true},   "807":{gps_accuracy:"High confidence in GPS fix accuracy"},"817":{gps_accuracy:"Reduced confidence in GPS fix accuracy"}}
              
            
                const decode_binary_code = ( ()=> {

                    for(let i = 0; i < current_byte_2_bin.length; i++ ){
                      let values = `${byte_array.indexOf(current_byte)}${current_byte_2_bin[i]}${i}`;//0 ==> byte position, 0 ==> binary value, 0 ==> binary position
                      

                      values !== "000" && values !== "001"                                               
                                              && ( () => {
                                                  let bit_value = value_of_each_bit[values];

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
        
        
        return object_with_datas_to_insert_on_tago;
    }  










     Decode_truncate_message(hexa_code){//private method
        console.log("Truncate")
    }











   Decode_type3_message(hexa_code, esn_value){//private method
        let object_with_datas_to_insert_on_tago = { variable:"ESN", value: esn_value, metadata:{} };

     //this code needs to be fixed, instead of convert to binary and after convert to deciaml, my code is going to convert direct of hex to decimal
        if(subtype()){
            if(subtype() === "DIAGNOSTIC MESSAGE"){console.log("diagnostic")
              return decode_diagnostic_message("diagnosticMessage/type3");
            
            }else if(subtype() === "REPLACE BATERY"){console.log("replace")
              return decode_diagnostic_message("bateryMessage/type3");//The replace battery message has a format almost identical to the diagnostic message. Therefore I Can use the same function to decode the content
            
            }else if(subtype() === "CONTACT SERVICE PROVIDER MESSAGE"){
              return hexa_code;

            }else if(subtype() === "ACCUMULATE/COUNT MESSAGE"){console.log("accumulate")
              return AccumulateCountMessage();

            }
      }





        function decode_diagnostic_message(subtype){
            let byte_array = new Array();
            let current_byte = "";

            
              for(let i= 0; i < hexa_code.length; i++){
                    current_byte += hexa_code[i];

                    if(current_byte.length === 2){//console.log(current_byte)
                      byte_array.push(current_byte);
                      let current_byte_2_bin = ("00000000" + (parseInt(current_byte, 16)).toString(2)).slice(-8);
                      let value_of_each_bit = { "103":(() => {  return { NumberOfTransmissions:parseInt(current_byte_2_bin[0] + current_byte_2_bin[1] + current_byte_2_bin[2] + current_byte_2_bin[3], 2)}  })(),   "113":(()=>{ return { NumberOfTransmissions:parseInt(current_byte_2_bin[0] + current_byte_2_bin[1] + current_byte_2_bin[2] + current_byte_2_bin[3], 2)}  })(),           "104": {BatteryCondition:"Good batery"}, "114":{BatteryCondition:"Replace batery"},             "105":{GPSsubsystemFault: "GPS system OK."}, "115":{GPSsubsystemFault: "Fault"},             "106":{TransmitterSubsystemFault: "Trasnmitter OK."}, "116":{TransmitterSubsystemFault: "Fault"},             "107":{SchedulerSubsystemFault: "Transmitter OK."}, "117":{SchedulerSubsystemFault: "Fault"},        "2":(() => {  return { MinInterval:parseInt(current_byte_2_bin,2) }  })(),          "3": ((binary) => {  return {Maxinterval:parseInt(current_byte_2_bin,2)}  })(),     "4":(() => { return {GPSMeanSearchTime:parseInt(current_byte_2_bin,2)} })(),       "6":(() => { let byte5_2_bin = ("00000000" + (parseInt(byte_array[5], 16)).toString(2)).slice(-8);  let byte6_to_bin = ("00000000" + (parseInt(byte_array[6], 16)).toString(2)).slice(-8);     return { GpsFails:parseInt(byte5_2_bin,2) + parseInt(byte6_to_bin,2)}  })(),       "8":(() => { let byte7_2_bin = ("00000000" + (parseInt(byte_array[7], 16)).toString(2)).slice(-8);  let byte8_to_bin = ("00000000" + (parseInt(byte_array[8], 16)).toString(2)).slice(-8);     return { transmissionNumbers: (parseInt(byte7_2_bin,2) + parseInt(byte8_to_bin,2)) }  })()   }

                        
                        if(byte_array.indexOf(current_byte) !== 0){

                              if(byte_array.indexOf(current_byte) === 1){

                                for(let i = 0; i < current_byte_2_bin.length; i++){
                                  let values = `${byte_array.indexOf(current_byte)}${current_byte_2_bin[i]}${i}`;//0 ==> byte position, 0 ==> binary value, 0 ==> binary position
                                  let bit_value = value_of_each_bit[values];

                                    if(bit_value !== undefined){
                                      Object.assign(object_with_datas_to_insert_on_tago.metadata, bit_value);                              
                                    }
                                    
                                    values = ""; 
                                }
                              
                              }else if(byte_array.indexOf(current_byte) === 2){
                                Object.assign(object_with_datas_to_insert_on_tago.metadata ,value_of_each_bit["2"]);

                              }else if(byte_array.indexOf(current_byte) === 3){
                                Object.assign(object_with_datas_to_insert_on_tago.metadata ,value_of_each_bit["3"]);

                              }else if(byte_array.indexOf(current_byte) === 4){
                                Object.assign(object_with_datas_to_insert_on_tago.metadata ,value_of_each_bit["4"]);

                              }else if(byte_array.indexOf(current_byte) === 6){
                                Object.assign(object_with_datas_to_insert_on_tago.metadata ,value_of_each_bit["6"]);//BYTE 5 and 6

                              }else if(byte_array.indexOf(current_byte) === 8){
                                Object.assign(object_with_datas_to_insert_on_tago.metadata ,value_of_each_bit["8"]);//BYTE 7 and 8

                              }

                        } 


                        current_byte_2_bin = "";
                        current_byte = "";
                    }

                }
 
                subtype === "diagnosticMessage/type3"
                             ?object_with_datas_to_insert_on_tago.subtype = "diagnosticMessage/type3"
                             :object_with_datas_to_insert_on_tago.sub_type = "bateryMessage/type3";

                return object_with_datas_to_insert_on_tago;
                
              }


          



            function AccumulateCountMessage(){
               let byte_array = new Array();
               let current_byte= "";

               for(let i = 0; i < hexa_code.length; i++){
                 current_byte += hexa_code[i];

                 if(current_byte.length === 2){//estou multiplicando os valores por 10 pq eu quero o tempo em minutos
                    byte_array.push(current_byte);
                    let value_of_each_bit = { "1":(() => {  if(hexa_code.substring(2,4) === "FFFF"){ return {Entry1Stored:"Turn entry 1 storage off"} }else{ return {Entry1Stored: ( (parseInt(hexa_code.substring(0,4), 16)) * 10 ) }}  })(), "3":(() => {  if(hexa_code.substring(2,4) === "FFFF"){ return {Entry2Stored:"Turn entry 1 storage off"} }else{ return { Entry2Stored: ( (parseInt(hexa_code.substring(4,8), 16)) * 10 )} }  })(), "5":{ StorageVibration: ( (parseInt(hexa_code.substring(8,12),16)) * 10 )}, "7":(() => { if(hexa_code.substring(0,2) === "FF"){ return {EntryCount1:"off"}  }else{ return{EntryCount1:( parseInt(hexa_code.substring(12,14),16) )} }  })(), "8":(() => { if(hexa_code.substring(0,2) === "FF"){ return {EntryCount2:"off"}  }else{ return{EntryCount2:( parseInt(hexa_code.substring(14,16),16) )} }  })() }
                    
                        
                    byte_array.indexOf(current_byte) === 1 // 1 and 2 byte
                    ? Object.assign(object_with_datas_to_insert_on_tago.metadata, value_of_each_bit["1"]) 

                    :byte_array.indexOf(current_byte) === 3 // 3 and 4 byte 
                    ? Object.assign(object_with_datas_to_insert_on_tago.metadata, value_of_each_bit["3"])

                    :byte_array.indexOf(current_byte) === 5 // 5 and 6 byte
                    ? Object.assign(object_with_datas_to_insert_on_tago.metadata, value_of_each_bit["5"])   

                    :byte_array.indexOf(current_byte) === 7 
                    ? Object.assign(object_with_datas_to_insert_on_tago.metadata, value_of_each_bit["7"]) 

                    :byte_array.indexOf(current_byte) === 8 
                    && Object.assign(object_with_datas_to_insert_on_tago.metadata, value_of_each_bit["8"]);


                    current_byte = "";
                 }

               }

               object_with_datas_to_insert_on_tago.subtype = "accumulateMessage/type3";
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
          
          //the type 3 can has many diffrents types of message, we can differentiate the messages trough of subtypes.
    }



    







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
      let firstTag = stu_message.indexOf(">", stu_message.indexOf("<payload"));
      let secondTag = stu_message.indexOf("</payload>", firstTag);
      return stu_message.substring(firstTag + 3,secondTag);
    }



 }



 module.exports = smart_one_c_message;
 