const location = require("../Apis/location");

class stx_message {


  catch_payload = (stu_message) => {
    //This function is catching the hexadecimal message sent by device
    let firstTag = stu_message.indexOf(">", stu_message.indexOf("<payload"));
    let secondTag = stu_message.indexOf("</payload>", firstTag);

    return stu_message.substring(firstTag + 3, secondTag);
  };





  hex_2_bin = (hexadecimal_content) => {
    return ("00000000" + parseInt(hexadecimal_content, 16).toString(2)).substr(-8);
  };





  decode_lat = (file_content, cardinal_position) => {
    let hexadecimal_lat = file_content.substring(0, 6);
    let lat = String(parseInt(hexadecimal_lat, 16)); //estou convertendo para inteiro um valor hexa, por isso eu coloco o 16 como parâmetro

    let first_2_numbers_of_coordinate = cardinal_position === "south"
                                                                ? "-" + lat.substring(0, 2)
                                                                : lat.substring(0, 2);

    let rest_of_coordinate = lat.substring(2);
    return first_2_numbers_of_coordinate + "." + rest_of_coordinate;
  };





  decode_lng = (file_content, cardinal_position) => {
    let hexadecimal_lng = file_content.substring(6, 12);
    let lng = String(parseInt(hexadecimal_lng, 16));

    let first_2_numbers_of_coordinate = cardinal_position === "weast"
                                                              ? "-" + lng.substring(0, 2)
                                                              : lng.substring(0, 2);

    let rest_of_coordinate = lng.substring(2);
    return first_2_numbers_of_coordinate + "." + rest_of_coordinate;
  };





  decode_binary_values = (file_content) => {
    let values_object = new Object();
    let binary = this.hex_2_bin(file_content.substring(12, 14));

    let value_of_each_byte = {
      0: (byte) => { byte === "0"   ?values_object.cardinal_position_s_n = "south"    :values_object.cardinal_position_s_n = "north"; },
      1: (byte) => { byte === "0"   ?values_object.cardinal_position_w_e = "weast"    :values_object.cardinal_position_w_e = "east";},
      2: (byte) => { byte === "0"   ?values_object.origin = "GPS"                     :values_object.origin = "GPS-DR";},
      3: (byte) => { byte === "0"   ?values_object.mode = 2                           :values_object.mode = 3; },
    };
    for (let i = 0; i <= 3; i++) { value_of_each_byte[String(i)](binary[i]); }//i --> binary position / binary[i] --> binary value

    
    let arr = [];
    arr["000"] = "N";//Norte - North
    arr["001"] = "NE";//Nordeste - Noth east
    arr["010"] = "E";//Leste - East
    arr["011"] = "SE";//Sudeste - Southeast
    arr["100"] = "S";//Sul - South
    arr["101"] = "SW";//Sudoeste - south-west
    arr["110"] = "W";//Oeste - West
    arr["111"] = "NW";//Noroeste - Northwest
    values_object.direction = arr[binary.substring(5)];


    let byte8 = this.hex_2_bin(file_content.substring(14, 16));
    if(byte8.substring(0, 1) === "0") { values_object.battery_change = false; }//trocar substring por posição [0]
    else{ values_object.battery_change = true; }


    let byte9 = file_content.substring(16, 18);
    values_object.lastSPD = parseInt(byte9, 16);

    if(values_object.mode === 2){ values_object.jamm = "NO JAMMING"; }
    else if(values_object.mode === 3){ values_object.jamm = "JAMMING DETECTED"; }

    return values_object; 
  };





  async decode(file_content, esn_value, unixtime) {
    const location_functions = new location();

    let payload = this.catch_payload(file_content);
    let bin_values_decoded = this.decode_binary_values(payload);

    let latitude = Number(this.decode_lat(payload, bin_values_decoded.cardinal_position_s_n));
    let longitude = Number(this.decode_lng(payload, bin_values_decoded.cardinal_position_w_e));
    
    if(latitude === 0 || longitude === 0) { return undefined };

    return {

      variable: "ESN",
      value: esn_value,
      time: unixtime,
      location: { type: "Point", coordinates: [longitude, latitude] },
      metadata: {
        lat: latitude,
        lon: longitude,
        spd: bin_values_decoded.lastSPD,
        direction: bin_values_decoded.direction,

        battery_volts: (bin_values_decoded.battery_change === true ?"low"  :"normal"),

        mode: bin_values_decoded.mode,
        jamm: bin_values_decoded.jamm,
        media: "STX",
        origin: bin_values_decoded.origin,
        xml: file_content,
        url_pin: {
          url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
          alias: `Open map at =${latitude},${longitude}`
        },
        link: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        address: await location_functions.get_address_through_coordinates(latitude, longitude),
        cops:"SGA SAT"
      }

    };

  }
}

module.exports = stx_message;
