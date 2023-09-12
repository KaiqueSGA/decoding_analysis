import { location_apis } from "../Apis/location";

export class stx_message {


  public catch_payload (stu_message: string): string{ //This function is catching the hexadecimal message sent by device
    let firstTag: number = stu_message.indexOf(">", stu_message.indexOf("<payload"));
    let secondTag: number = stu_message.indexOf("</payload>", firstTag);

    return stu_message.substring(firstTag + 3, secondTag);
  };





  public hex_2_bin(hexadecimal_content: string): string {
    return ("00000000" + parseInt(hexadecimal_content, 16).toString(2)).substr(-8);
  };





  public decode_lat(file_content: string, cardinal_position: string): string {
    let hexadecimal_lat: string = file_content.substring(0, 6);
    let integer_lat: number = parseInt(hexadecimal_lat, 16); //estou convertendo para inteiro um valor hexa, por isso eu coloco o 16 como parâmetro
     
    let final_lat: number = integer_lat / 10_000; 
    let ready_coordinate: string = cardinal_position === "south"
                                                      ? "-" + String(final_lat.toFixed(8))
                                                      : String(final_lat.toFixed(8));

    return ready_coordinate; 
  };





  public decode_lng(file_content: string, cardinal_position: string): string{
    let hexadecimal_lng: string = file_content.substring(6, 12);
    let integer_lng: number = parseInt(hexadecimal_lng, 16);

    let final_lng: number = integer_lng / 10_000; 
    let ready_coordinate: string = cardinal_position === "weast"
                                                     ? "-" + String(final_lng.toFixed(8))
                                                     : String(final_lng.toFixed(8));

    return ready_coordinate; 
  };





  public decode_binary_values(file_content: string): any{
    let values_object = {cardinal_position_s_n: "", cardinal_position_w_e:"", origin:"", mode:0, battery_change:false, direction:"", lastSPD: 0, jamm:""};
    let binary: string = this.hex_2_bin(file_content.substring(12, 14));

    let value_of_each_byte: Array<(byte:string) => void> = [];
    value_of_each_byte[0] =  (byte: string): void => { byte === "0"   ?values_object.cardinal_position_s_n = "south"    :values_object.cardinal_position_s_n = "north"; };
    value_of_each_byte[1] =  (byte: string): void => { byte === "0"   ?values_object.cardinal_position_w_e = "weast"    :values_object.cardinal_position_w_e = "east";};
    value_of_each_byte[2] =  (byte: string): void => { byte === "0"   ?values_object.origin = "GPS"                     :values_object.origin = "GPS-DR";};
    value_of_each_byte[3] =  (byte: string): void => { byte === "0"   ?values_object.mode = 2                           :values_object.mode = 3; };
   
    for (let i = 0; i <= 3; i++) {value_of_each_byte[i](binary[i]); }//i --> binary position / binary[i] --> binary value

    if(binary.substring(5) === "000"){ values_object.direction = "N"}//Norte - North
    else if(binary.substring(5) === "001"){ values_object.direction = "NE"}//Nordeste - Noth east
    else if(binary.substring(5) === "010"){ values_object.direction = "E"}//Leste - East
    else if(binary.substring(5) === "011"){ values_object.direction = "SE"}//Sudeste - Southeast
    else if(binary.substring(5) === "100"){ values_object.direction = "S"}//Sul - South
    else if(binary.substring(5) === "101"){ values_object.direction = "SW"}//Sudoeste - south-west
    else if(binary.substring(5) === "110"){ values_object.direction = "W"}//Oeste - West
    else if(binary.substring(5) === "111"){ values_object.direction = "NW"}//Noroeste - Northwest


    let byte8: string = this.hex_2_bin(file_content.substring(14, 16));
    if(byte8.substring(0, 1) === "0") { values_object.battery_change = false; }//trocar substring por posição [0]
    else{ values_object.battery_change = true; }


    let byte9: string = file_content.substring(16, 18);
    values_object.lastSPD = parseInt(byte9, 16);

    if(values_object.mode === 2){ values_object.jamm = "NO JAMMING"; }
    else if(values_object.mode === 3){ values_object.jamm = "JAMMING DETECTED"; }

    return values_object; 
  };





  async decode(file_content: string, esn_value: string, unixtime: Date) {
    const location_functions = new location_apis();
    let decoded_object: any = { };

    let payload: string = this.catch_payload(file_content);
    let bin_values_decoded: any = this.decode_binary_values(payload);

    let latitude: number = Number(this.decode_lat(payload, bin_values_decoded.cardinal_position_s_n));
    let longitude: number = Number(this.decode_lng(payload, bin_values_decoded.cardinal_position_w_e));
    

    decoded_object.variable = "ESN";
    decoded_object.value = esn_value;
    decoded_object.time = unixtime;
    decoded_object.metadata = {};

    if(latitude !== 0 && longitude !== 0) {
      decoded_object.location = { type: "Point", coordinates: [longitude, latitude] };
      decoded_object.metadata.lat = latitude;
      decoded_object.metadata.lon = longitude;
      decoded_object.metadata.url_pin = { url: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, alias: `Open map at ${latitude},${longitude}`};
      decoded_object.metadata.link = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      decoded_object.metadata.address = await location_functions.get_address_through_coordinates(latitude, longitude); 
    };

    
    decoded_object.metadata.spd = bin_values_decoded.lastSPD;
    decoded_object.metadata.direction = bin_values_decoded.direction;
    decoded_object.metadata.battery_volts = (bin_values_decoded.battery_change === true ?"low"  :"normal");
    decoded_object.metadata.mode = bin_values_decoded.mode;
    decoded_object.metadata.jamm = bin_values_decoded.jamm;
    decoded_object.metadata.media = "STX";
    decoded_object.metadata.origin = bin_values_decoded.origin;
    decoded_object.metadata.xml = file_content;
    decoded_object.metadata.cops = "SGA SAT",
    decoded_object.metadata.dr_cal = "null",
    decoded_object.metadata.gyro_cal = "null"
  
    return decoded_object;
    

  }
};


