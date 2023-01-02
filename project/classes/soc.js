//Dev: Kaique YUdji
//Date:27/12/2022
//Code description: In this file, i'm decoding the xml files storaged per the ftp server. The code that I created is first creating all function and after call them


class smart_one_c_message{

    async get_file_content(xml_file_name, ftp_connection){
        let file_content;
        
        await ftp_connection.get(`./${xml_file_name}`, async function(err, stream) {
            
              if(err){ 
                  throw err
              }else{
                  stream.once('close', function() {});

                  await stream.on('data', (chunk) => {
                    file_content = "";
                    file_content = file_content + chunk;

                    if(!file_content.includes("</payload>")){/*  console.log(this.delete_file_from_ftp()) */ };
                });     

              }
              
        });


        return new Promise((resolve, reject) => {
          setTimeout(() => {
              this.file_content = file_content;console.log(file_content)
              let stu_messages = file_content.split("</stuMessage>");
              stu_messages.pop();//I'm removing the las position because the last position doesn't have anything.
              return resolve(stu_messages);
          }, 4000)//diminuir o tempo do setTimeout(), mandar uma lista de acordo com a quantidade de stu messages que existem dentro do device
        })
        
      
    }










     decode(file_content, esn_value){

          let hexa_code = get_hexa_code_from_ftp_file(file_content);

            //The GlobalStar has 3 differents types of messages: Default Message, Diagnostic Message and StoreCount Message. We can find out the typeof message through of first byte.
            let byte_that_countains_the_type_of_message = hexa_code.substring(0,2);
            let hex_2_bin = ("00000000" + (parseInt(byte_that_countains_the_type_of_message, 16)).toString(2));
            let bin_2_decimal = parseInt(hex_2_bin.substring(0,2),2);//I'm cutting the string(hex_to_bin) because i need just of two first bits to define the type of my message;
                  
              if(bin_2_decimal === 0){
                return Decode_default_message(hexa_code);

              }else if(bin_2_decimal === 1){
                    return Decode_truncate_message(hexa_code);

              }else{
                  return Decode_type3_message(hexa_code);
              } 










            function decode_lat(latitude_hexadecimal_format){
              let hex_2_decimal = parseInt(latitude_hexadecimal_format,16); 
      
              let degree_per_count_lat = (90.0 / Math.pow(2,23)); 
              let latitude = hex_2_decimal * degree_per_count_lat > 90.0
                                          ? (hex_2_decimal * degree_per_count_lat) - 180
                                          : (hex_2_decimal * degree_per_count_lat); 
              return latitude;
            }
      
            function decode_lng(longitude_hexadecimal_format){
              let hex_2_decimal = parseInt(longitude_hexadecimal_format,16); 
      
              let degree_per_count_long  = (180.0 / Math.pow(2,23));
              let longitude = hex_2_decimal * degree_per_count_long > 180 
                                          ? (hex_2_decimal * degree_per_count_long) - 360
                                          : (hex_2_decimal * degree_per_count_long); 
              return longitude;
            }

            function get_hexa_code_from_ftp_file(stu_message){
              let firstTag = stu_message.indexOf(">", stu_message.indexOf("<payload"));
              let secondTag = stu_message.indexOf("</payload>", firstTag);
              return stu_message.substring(firstTag + 3,secondTag);
            }










          function Decode_default_message(hexa_code){

            let latitude_hexadecimal_format = hexa_code.substring(2,8); 
            let longitude_hexadecimal_format = hexa_code.substring(8,14);

            const latitude = decode_lat(latitude_hexadecimal_format);
            const longitude = decode_lng(longitude_hexadecimal_format);
            

            let object_with_datas_to_insert_on_tago = { variable:"ESN", value: esn_value, location:{ type:"Point", coordinates:[longitude,latitude] }, metadata:{} }; //this object will be filled during of decoding of bits of each byte
            let current_byte = "";
            let byte_array = new Array()

              for(let i= 0; i < hexa_code.length; i++){
                current_byte += hexa_code[i];
              
                if(current_byte.length === 2){
                  byte_array.push(current_byte)//A byte is formated per 2 characters of code hexadecimal, therefore I added the byte equals the length of 2 characters the array of bytes. 
                  let current_byte_2_bin = ("00000000" + (parseInt(current_byte, 16)).toString(2)).slice(-8);
                  let value_of_each_bit = {  "002":{batery:"Good Batery"}, "012":{batery:"replace batery"},    "003":{gps_data:"GPS Data valid"},"013":{gps_data:"GPS Data wrong"},    "014":{missed_input1:true},"015":{missed_input2:true},   "006":"","016":"",   "007":( () => { let binary_code = current_byte_2_bin[6] + current_byte_2_bin[7];   let bin_2_decimal = parseInt(binary_code,2);    object_with_datas_to_insert_on_tago["metadata"]["gps_fail_counter"] = bin_2_decimal; } )(),  "017":( () => { let binary_code = current_byte_2_bin[6] + current_byte_2_bin[7];   let bin_2_decimal = parseInt(binary_code,2);    object_with_datas_to_insert_on_tago["metadata"]["gps_fail_counter"] = bin_2_decimal; } )(),   "700":{input1_change:"Did not trigger message"},"710":{input1_change:"Triggered message"},   "701":{input1_state:"closed"},"711":{input1_state:"open"},   "702":{input2_change:"Did not trigger message"},"712":{input2_change:"Triggered message"},   "703":{Input2_state:"closed"},"713":{Input2_state:"open"},   "704":"","714":"","705":"","715":"","706":"","716":"","707":( () => {})(), "717": (() => { let binary_code = current_byte_2_bin[4] + current_byte_2_bin[5] + current_byte_2_bin[6] + current_byte_2_bin[7];  let bin_2_decimal = parseInt(binary_code,2);  bin_2_decimal === 0 ?object_with_datas_to_insert_on_tago["metadata"]["sub_type"] = "location message" : bin_2_decimal === 1 ?object_with_datas_to_insert_on_tago["metadata"]["sub_type"] = "Device Turned on Message" : bin_2_decimal === 2 ? object_with_datas_to_insert_on_tago["metadata"]["sub_type"] = "Change of location area alert message" :  bin_2_decimal === 3 ? object_with_datas_to_insert_on_tago["metadata"]["sub_type"] = "Input status changed message" : bin_2_decimal === 4 ? object_with_datas_to_insert_on_tago["metadata"]["sub_type"] = "undesired input state message" :object_with_datas_to_insert_on_tago["metadata"]["sub_type"]="re-centering message" })(),    "803":{vibration_state_changed:"This message is being transmitted for a reason other than the above reasons"},"813":{vibration_state_changed:"vibration just changed state"},   "804":{vibration_Unit:"is not in a state of vibration"},"814":{vibration_Unit:"Unit is in a state of vibration"},   "805":{type_location:"GPS data reported is from a 3D fix"},"815":{type_location:"GPS data reported is from a 2D fix"},   "806":{in_motion:false},   "816":{in_motion:true},   "807":{gps_accuracy:"High confidence in GPS fix accuracy"},"817":{gps_accuracy:"Reduced confidence in GPS fix accuracy"}}
                  
                
                    const decode_binary_code = ( ()=> {

                        for(let i = 0; i < current_byte_2_bin.length; i++ ){
                          let values = `${byte_array.indexOf(current_byte)}${current_byte_2_bin[i]}${i}`;
        
                          values === ("000" || "001") 
                                                  ? ''
                                                  : ( () => {
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










          function Decode_truncate_message(hexa_code){

          }










          function Decode_type3_message(hexa_code){//the type 3 can has many diffrents types of message, we can differentiate the messages trough of subtypes.

          }

    }










    async delete_file_from_ftp(xml_file_name, ftp_connection){
   
       let resp = await ftp_connection.put(this.file_content,`./Battery Bank Test/${xml_file_name}`, function(err){
        if(err){
          return err;
        }
        else{
            ftp_connection.delete(`./${xml_file_name}`,function(err){
                  if(err){
                    return err;
                  }
                  else{
                    console.log("deleted");
                  }
              })
          }
    
        })
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
              return resolve(resp);
          }, 4000)//diminuir o tempo do setTimeout(), mandar uma lista de acordo com a quantidade de stu messages que existem dentro do device
        })
        

       
    }

    








    async insert_on_tago(decoded_code, account_tago, Device, device_id){
      let device_token = (await account_tago.devices.paramList(device_id)).find(parameter => parameter.key === "device_token").value;
      const tago_device = new Device({ token: device_token });
      return  await tago_device.sendData(decoded_code);
    }
 }



 module.exports = smart_one_c_message;
 