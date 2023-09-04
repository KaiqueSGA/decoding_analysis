const location = require("../../Apis/location");
const gps_sentences = require("../mqtt/gps_sentences");


  
  decode = async (scope) => {
    
    var values_array = scope[0].value.split(";"); //The device send a string with many values inside of field value(these values are represanting an object, this is the structure: ESN,176823;battery,good;), each 'field' is separeted by ";" and the field key and its value are separeted by "," .
    const gps_sentence = new gps_sentences({ variable:values_array[0], value:values_array[1], metadata: { raw_data: scope[0].value}}); 


    for (let i = 2; i < values_array.length; i++) {
        //I'm starting by the value 2 because the 2 first fields aren't necessary to this part of code
        values_array[i] = values_array[i].replace("+", "");

        var field_key = values_array[i].split(",")[0].trim();
        var field_value = values_array[i].replace(field_key + ",", "").trim();

        if(field_key == "EOF") { i = values_array.length; }
        gps_sentence.new_variable_to_be_inserted.metadata[field_key.toLowerCase()] = field_value;

        //Fields that need be calculated to find out its value
        if (field_key.startsWith("battery_volts")) { gps_sentence.add_battery_field(field_value); }
        else if (field_key.startsWith("cops")) { gps_sentence.add_operator_field(field_value); }
        else if (field_key.startsWith("jamm")) { gps_sentence.add_jamming_state(field_value); }
        else if (field_key.startsWith("gns")) { gps_sentence.decode_gns(field_value);} //SIM7000G Proprietary GPS Sentence
        else if (field_key.startsWith("gll")) { gps_sentence.decode_gll(field_value); }
        else if (field_key.startsWith("gga")) { gps_sentence.decode_gga(field_value); }
        else if (field_key.startsWith("zda")) { gps_sentence.decode_zda(field_value); } 
        else if (field_key.startsWith("vtg")) { gps_sentence.decode_vtg(field_value); } 
    }


     if(values_array.find(item => item.includes("rmc")) !== undefined){

      let field_key = values_array.find(item => item.includes("rmc")).split(",")[0].trim();
      let field_value = values_array.find(item => item.includes("rmc")).replace(field_key + ",", "").trim();
      await gps_sentence.decode_rmc(field_value);

    }else{//se o device não enviar a sentença GNRMC vou executar este bloco
        const location_functions = new location();
        const map_link = "https://www.google.com/maps/search/?api=1&query=";

        var mac_coordinates = gps_sentence.new_variable_to_be_inserted.metadata.mac0 ?await location_functions.get_coordinates_through_mac_datas( ["mac0", "mac1", "mac2"], gps_sentence.new_variable_to_be_inserted ) :{lat:0, lng:0};
        var lbs_coordinates = gps_sentence.new_variable_to_be_inserted.metadata.lbs0 ?await location_functions.get_coordinates_through_lbs_datas( ["lbs0", "lbs1", "lbs2"], gps_sentence.new_variable_to_be_inserted, gps_sentence.new_variable_to_be_inserted.metadata.lbs_mode === "LTE" ?"lte" :"gsm" ) :{lat:0, lng:0}; 

        if(mac_coordinates.lat != 0 && mac_coordinates.lng != 0){
          gps_sentence.new_variable_to_be_inserted.metadata.mac_lat = mac_coordinates.lat;
          gps_sentence.new_variable_to_be_inserted.metadata.mac_lon = mac_coordinates.lng;
          gps_sentence.new_variable_to_be_inserted.metadata.mac_link = map_link + mac_coordinates.lat + "," + mac_coordinates.lng;
        }
      
        if(lbs_coordinates.lat != 0 && lbs_coordinates.lng != 0){
          gps_sentence.new_variable_to_be_inserted.metadata.lbs_lat = lbs_coordinates.lat;
          gps_sentence.new_variable_to_be_inserted.metadata.lbs_lon = lbs_coordinates.lng;
          gps_sentence.new_variable_to_be_inserted.metadata.lbs_link = map_link + lbs_coordinates.lat + "," + lbs_coordinates.lng;
        }

        if(mac_coordinates.lat === 0  &&  lbs_coordinates.lat === 0){ process.kill(process.pid, 'SIGINT'); return;  }

        let coordinates = mac_coordinates.lat != 0 ?mac_coordinates :lbs_coordinates;

        gps_sentence.new_variable_to_be_inserted.metadata.origin = mac_coordinates.lat != 0   ?"MAC"  :"LBS";
        gps_sentence.new_variable_to_be_inserted.location = { type:"Point", coordinates:[ coordinates.lng, coordinates.lat]};
        gps_sentence.new_variable_to_be_inserted.metadata.url_pin = {};
        gps_sentence.new_variable_to_be_inserted.metadata.url_pin.url = map_link + coordinates.lat + "," + coordinates.lng;
        gps_sentence.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + coordinates.lat + "," + coordinates.lng;
        gps_sentence.new_variable_to_be_inserted.metadata.link = map_link + coordinates.lat + "," + coordinates.lng;
    };

    if(values_array.find(item => item.includes("psti20")) !== undefined){

      let field_key = values_array.find(item => item.includes("psti20")).split(",")[0].trim();
      let field_value = values_array.find(item => item.includes("psti20")).replace(field_key + ",", "").trim();
      gps_sentence.decode_psti20(field_value);

    }

    
    
     if(gps_sentence.new_variable_to_be_inserted.metadata.zda_time){
      gps_sentence.new_variable_to_be_inserted.time = gps_sentence.new_variable_to_be_inserted.metadata.zda_time.replace(" ", "T").concat("Z");
      delete gps_sentence.new_variable_to_be_inserted.metadata.zda_time;
      
    }else if(gps_sentence.new_variable_to_be_inserted.metadata.rtc) { gps_sentence.new_variable_to_be_inserted.time = gps_sentence.new_variable_to_be_inserted.metadata.RTC; }
 
 
    delete gps_sentence.new_variable_to_be_inserted.metadata.EOF; //clean EOF mark
    return gps_sentence.new_variable_to_be_inserted; 
  };


  module.exports = { decode: decode };
