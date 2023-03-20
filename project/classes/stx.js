const ftp_and_tago_function = require("./ftp_and_tago_functions");



class stx_message extends ftp_and_tago_function{
  
  constructor(xml_file_name, ftp_connection){
    super(xml_file_name, ftp_connection);
  }




     catch_payload = (stu_message) => {//This function is catching the hexadecimal message sent by device
      let firstTag = stu_message.indexOf(">",stu_message.indexOf("<payload"));
      let secondTag = stu_message.indexOf("</payload>",firstTag);
    
      return stu_message.substring(firstTag + 3,secondTag );
     }


  


     hex_2_bin = (hexadecimal_content) => {
      return ("00000000" + (parseInt(hexadecimal_content, 16)).toString(2)).substr(-8);
     }






     decode_lat = (file_content, cardinal_point) => {
      let hexadecimal_lat = file_content.substring(0,6);      
      let lat = String(parseInt(hexadecimal_lat,16));//estou convertendo para inteiro um valor hexa, por isso eu coloco o 16 como parâmetro
     
      let first_2_numbers_of_coordinate = cardinal_point.cardinal_position === "south" 
                                                 ?  "-" + lat.substring(0,2)
                                                 :  lat.substring(0,2);
    
      let rest_of_coordinate = lat.substring(2);
      
      return (first_2_numbers_of_coordinate + "." + rest_of_coordinate);
     }





     decode_lng = (file_content, cardinal_point) => {
      let hexadecimal_lng = file_content.substring(6,12);  
      let lng = String(parseInt(hexadecimal_lng,16));
    
      
      let first_2_numbers_of_coordinate = cardinal_point.cardinal_position === "weast" 
                                                ?  "-" + lng.substring(0,2)
                                                :  lng.substring(0,2);
    
      let rest_of_coordinate = lng.substring(2);
    
      return (first_2_numbers_of_coordinate + "." + rest_of_coordinate);
     }




     
     decode_binary_values = (file_content) => {
      let object_array = new Array();
      let binary = this.hex_2_bin( file_content.substring(12,14) );
      
      let value_of_each_byte = {
        "0":(byte) => { byte === "0" ?object_array.push({cardinal_position: 'south'}) :object_array.push({cardinal_position: 'north'}) },
        "1":(byte) => { byte === "0" ?object_array.push({cardinal_position: "weast"}) :object_array.push({cardinal_point: "east"})},
        "2":(byte) => { byte === "0" ?object_array.push({origin: "GPS"}) :object_array.push({origin: "GPS-DR"}) },
        "3":(byte) => { byte === "0" ?object_array.push({mode: 2}) :object_array.push({mode: "jamming"})}
      }
     
      //i --> binary position / binary[i] --> binary value
      for(let i = 0; i <= 3; i++){ value_of_each_byte[String(i)](binary[i]) };


        let arr = []
        arr["000"] = "N";//Norte - North
        arr["001"] = "NE";//Nordeste - Noth east
        arr["010"] = "E";//Leste - East
        arr["011"] = "SE";//Sudeste - Southeast
        arr["100"] = "S";//Sul - South
        arr["101"] = "SW";//Sudoeste - south-west
        arr["110"] = "W";//Oeste - West
        arr["111"] = "NW";//Noroeste - Northwest
        object_array.push({direction: arr[binary.substring(5)]}); 
      

        let byte8 = this.hex_2_bin(file_content.substring(14,16));
        if(byte8.substring(0,1) === '0'){
          object_array.push({batery: "normal"});
        }else{
          object_array.push({batery: "low"});
        }
      
        let byte9 =  file_content.substring(16,18);
        object_array.push({lastSPD: parseInt(byte9,16)});
        
        return object_array;
     }





     decode(file_content, esn_value){ 

       file_content = this.catch_payload(file_content);
       let bin_values_decoded = this.decode_binary_values(file_content);

       let latitude = Number(this.decode_lat(file_content, bin_values_decoded[0]));
       let longitude = Number(this.decode_lng(file_content, bin_values_decoded[1]));            

           return {
            variable: 'ESN',
            value: esn_value,
            location:{ type:"Point", coordinates:[longitude,latitude] },
            metadata: {
              lat: latitude,
              lon: longitude,
              spd: bin_values_decoded[6].lastSPD,
              direction: bin_values_decoded[4].direction,
              
              batery: bin_values_decoded[5].batery,

              mode: bin_values_decoded[3].mode,
              media: 'STX',
              origin: bin_values_decoded[2].origin
            }
          } 

      }




}



module.exports = stx_message;