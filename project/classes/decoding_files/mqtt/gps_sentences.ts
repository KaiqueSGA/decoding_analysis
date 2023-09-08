/* 
   Script purpose: This script stores a class called gps_sentences. This class is responsible per decode all GPS sentences sent by device.
   These sentences are sent by device just through of communication protocol MQTT.
   To know better about the decoding of each sentence, you need to read the handbook of GPS module.
   
   The device sent these sentences through of a big string, when each field is separeted by: ";", and the separetion between field and value is separeted by ","
   
   ex:esn;0-4242117;model,AT-G1018;hmv,0.1M4;fmv,0.8M4;mode,BEACON;media,GSM/GPRS;rtc,2023-03-24 18:40:23;battery_volts,3.84;imei,869951032048823;iccid,8944500601200071406F;cops,CLARO BR;jamm,+SJDR: NO JAMMING;rf_model,HC-12;rf_channel,001;rmc,$GNRMC,184028.000,V,2335.73047,S,04638.18496,W,000.0,000.0,240323,,,N,V*15;vtg,$GNVTG,000.0,T,,M,000.0,N,000.0,K,N*1C;zda,$GNZDA,180528.000,04,09,2023,00,00*49;psti20,$PSTI,20,0,1,1,0,N,1,0,-1.04,100.00,0.00,0.00*7A;psti60,$PSTI,060,0,V,0.00,34.16,0.00,,,,,,,,*60;psti63,$PSTI,063,G,0.52,-0.01,0.29,C,0.53,-0.01,0.28*03;psti65,$PSTI,065,A,0.85,-8.09,5.50,N,0.00,0.00,0.00*2F;psti70,$PSTI,070,T,I,57.6*2E;mac0,08:a7:c0:76:13:10;mac1,c0:3d:d9:10:79:f0;mac2,ce:32:e5:21:0b:80;lbs_mode,LTE;lbs0,LBS0,9610,290,-93,-56,-18,-8,46111,28560395,724,05,255
       model:AT-g1018
       hmv:0.8m4
       zda:$GNZDA,180528.000,04,09,2023,00,00*49

   In this class, i have the sentences of two gps modules, therefore it's possible that different fuctions do the same thing
   */


import { location_apis } from "../../Apis/location";


export class gps_sentences {
    private coordinates_origin: string = "";
    public new_variable_to_be_inserted: any;
    private mapLINK: string = "https://www.google.com/maps/search/?api=1&query=";

    constructor(new_variable_to_be_inserted: any){
        this.new_variable_to_be_inserted = new_variable_to_be_inserted;
    };
   

    public decode_gns(sentence_value: string): void{//public method
        sentence_value = sentence_value.replace("*", ",");
        sentence_value = sentence_value.replace(":", ",");
    
        var values_array: Array<string> = sentence_value.split(",");
    
        
        var origin_field: string = values_array[9];
        if(origin_field == '0'){return}; //new_variable_to_be_inserted.metadata.ORIGIN = "ERR";
        if(origin_field == '1'){this.new_variable_to_be_inserted.metadata.origin = "GPS";}
        if(origin_field == '2'){this.new_variable_to_be_inserted.metadata.origin = "GPS-DR";}
    
        //location
        this.new_variable_to_be_inserted.location = {};
        this.new_variable_to_be_inserted.location.lat = parseFloat(values_array[4]);
        this.new_variable_to_be_inserted.location.lng = parseFloat(values_array[5]);
    
        //MAPLINK
        var geography_coordinates: number = Number(values_array[4] + "," + values_array[5]);
        this.new_variable_to_be_inserted.metadata.url_pin = {};
        this.new_variable_to_be_inserted.metadata.url_pin.url = geography_coordinates;
        this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + geography_coordinates;
        this.new_variable_to_be_inserted.metadata.link = geography_coordinates;
    
        //MORE METADATA
        this.new_variable_to_be_inserted.metadata.lat = values_array[4]; //field name to lowercase
        this.new_variable_to_be_inserted.metadata.lon = values_array[5]; //field name to lowercase
        this.new_variable_to_be_inserted.metadata.alt = values_array[6]; //field name to lowercase
        this.new_variable_to_be_inserted.metadata.spd = values_array[7]; //field name to lowercase
        this.new_variable_to_be_inserted.metadata.cog = values_array[8]; //field name to lowercase
    
        //cog = Course over the ground. The value of this variable varies from (000.0 ~ 359.9) in degrees
        let cog = parseInt(this.new_variable_to_be_inserted.metadata.cog); 
        let direction: string = "";

        direction = this.get_cardinal_direction(cog);
        this.new_variable_to_be_inserted.metadata.direction = direction;
    
        //DATE/TIME
        let date = values_array[3].substring(0, 4) + "-" + values_array[3].substring(4, 6) + "-" + values_array[3].substring(6, 8) + "T";
        let time = values_array[3].substring(8, 10) + ":" + values_array[3].substring(10, 12) + ":" + values_array[3].substring(12, 14);
        let date_time = date + time;

        this.new_variable_to_be_inserted.metadata.rtc = date_time;
    };





    private transform_raw_data_into_coordinates(sentence_value: string): string{//public method
        let raw_coordinate: number = parseFloat(sentence_value);
        raw_coordinate = raw_coordinate / 100;

        let coordinate_integer_value: number = parseInt(String(raw_coordinate));//For instance: latitude = 23.98374, then its integer value is: 23

        /* This code block is responsible per process the raw coordinate and transform it into "real" coordinates */
        raw_coordinate = raw_coordinate - coordinate_integer_value;
        raw_coordinate = raw_coordinate / 0.6;
        raw_coordinate = raw_coordinate + coordinate_integer_value;
        sentence_value = String(raw_coordinate.toFixed(8)); //8 = Better Results

        return sentence_value;
    };





    public async decode_rmc(sentence_value: string): Promise<void>{
        let location_functions = new location_apis();

        sentence_value = sentence_value.replace("*", ",");
        let values_array: Array<string> = sentence_value.split(",");
    
        /* By standart, the device can send 3 types of coordinates: GPS, MAC, and LBS. These coordinates types have "levels priority", the most important type is the GPS, the second one is: MAC, and the third one is: LBS.  */
        let mac_coordinates: any = this.new_variable_to_be_inserted.metadata.mac0 ?await location_functions.get_coordinates_through_mac_datas( ["mac0", "mac1", "mac2"], this.new_variable_to_be_inserted ) :{lat:0, lng:0};
        let lbs_coordinates: any = this.new_variable_to_be_inserted.metadata.lbs0 ?await location_functions.get_coordinates_through_lbs_datas( ["lbs0", "lbs1", "lbs2"], this.new_variable_to_be_inserted, this.new_variable_to_be_inserted.metadata.lbs_mode === "LTE" ?"lte" :"gsm" ) :{lat:0, lng:0}; 
    
        if(mac_coordinates.lat != 0 && mac_coordinates.lng != 0){
          this.new_variable_to_be_inserted.metadata.mac_lat = mac_coordinates.lat;
          this.new_variable_to_be_inserted.metadata.mac_lon = mac_coordinates.lng;
          this.new_variable_to_be_inserted.metadata.mac_link = this.mapLINK + mac_coordinates.lat + "," + mac_coordinates.lng;
        }
       
        if(lbs_coordinates.lat != 0 && lbs_coordinates.lng != 0){
          this.new_variable_to_be_inserted.metadata.lbs_lat = lbs_coordinates.lat;
          this.new_variable_to_be_inserted.metadata.lbs_lon = lbs_coordinates.lng;
          this.new_variable_to_be_inserted.metadata.lbs_link = this.mapLINK + lbs_coordinates.lat + "," + lbs_coordinates.lng;
        }
    
    
    
        if(values_array[12] == "N"){//The value in the position 12 will "say" if the coordinates sent by device are correct... If the device send the value "N" the gps value send by device is incorrect, therefore the algorithim is going to catch the coordinates through of another method. 
          
          if(mac_coordinates.lat === 0  &&  lbs_coordinates.lat === 0){
             process.kill(process.pid, 'SIGINT'); 
             return;  
          }
    
          let coordinates = mac_coordinates.lat != 0 ?mac_coordinates :lbs_coordinates;
          this.coordinates_origin = mac_coordinates.lat != 0   ?"MAC"  :"LBS";
    
           if(coordinates.lat === 0 || coordinates.lng === 0){//remove this code
            let latitude: string = values_array[3];
            let longitude: string = values_array[5];
    
            let tmpNS: string = values_array[4];
            var tmpEW: string = values_array[6];
    
            latitude = this.transform_raw_data_into_coordinates(latitude);
            if(tmpNS == "S") { coordinates.lat = "-" + latitude; }
        
            longitude = this.transform_raw_data_into_coordinates(longitude);
            if(tmpEW == "W") { coordinates.lng = "-" + longitude; }
          } 
    
    
          let knot: number = 1.852;
          let speed: string = (parseInt(values_array[7]) * knot).toFixed(1);
          let cog: number = parseInt(values_array[8]);//Course over the ground. The value of this variable varies from (000.0 ~ 359.9) in degrees. From this value, we can get the cardinal_direction
          
          let direction: string = this.get_cardinal_direction(cog);
          let tmpIEC: string = values_array[13];
    
          this.new_variable_to_be_inserted.location = { type:"Point", coordinates:[ coordinates.lng, coordinates.lat]};
          this.new_variable_to_be_inserted.metadata.url_pin = {};
          this.new_variable_to_be_inserted.metadata.url_pin.url = this.mapLINK + coordinates.lat + "," + coordinates.lng;
          this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + coordinates.lat + "," + coordinates.lng;
          this.new_variable_to_be_inserted.metadata.link = this.mapLINK + coordinates.lat + "," + coordinates.lng;
          this.new_variable_to_be_inserted.metadata.lat = coordinates.lat; 
          this.new_variable_to_be_inserted.metadata.lon = coordinates.lng; 
          this.new_variable_to_be_inserted.metadata.spd = speed; 
          this.new_variable_to_be_inserted.metadata.cog = cog;
          this.new_variable_to_be_inserted.metadata.direction = direction;
          this.new_variable_to_be_inserted.metadata.IEC = tmpIEC;
          this.new_variable_to_be_inserted.metadata.address = await location_functions.get_address_through_coordinates(coordinates.lat, coordinates.lng);
    
          return;


        }else{

          let north_south: string = values_array[4];
          let east_west: string = values_array[6];

          let latitude: string = this.transform_raw_data_into_coordinates(values_array[3]);
          if (north_south == "S") latitude = "-" + latitude;

          let longitude: string = this.transform_raw_data_into_coordinates(values_array[5]);
          if (east_west == "W") longitude = "-" + longitude;

          //Speed from knots to Km/h
          let knot: number = 1.852;
          let speed: string = (parseInt(values_array[7]) * knot).toFixed(1);
          let cog: number = parseInt(values_array[8]);

          let direction: string = this.get_cardinal_direction(cog);
          let tmpIEC: string = values_array[13];
      
          //location
          this.new_variable_to_be_inserted.location = {};
          this.new_variable_to_be_inserted.location = { type:"Point", coordinates:[ parseFloat(longitude), parseFloat(latitude)]};
        
      
          //MAPLINK
          let geography_coordinates: string = latitude + "," + longitude;
          let tmpLINK: string = this.mapLINK + geography_coordinates;
          this.new_variable_to_be_inserted.metadata.url_pin = {};
          this.new_variable_to_be_inserted.metadata.url_pin.url = tmpLINK;
          this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + geography_coordinates;
          this.new_variable_to_be_inserted.metadata.link = tmpLINK; 
      
          
          //MORE METADATA
          this.new_variable_to_be_inserted.metadata.lat = latitude; 
          this.new_variable_to_be_inserted.metadata.lon = longitude; 
          this.new_variable_to_be_inserted.metadata.spd = speed; 
          this.new_variable_to_be_inserted.metadata.cog = cog;
          this.new_variable_to_be_inserted.metadata.direction = direction;
          this.new_variable_to_be_inserted.metadata.IEC = tmpIEC;
          this.new_variable_to_be_inserted.metadata.address = await location_functions.get_address_through_coordinates(latitude, longitude);
        }
    };





    public decode_gll(sentence_value: string): void{
        sentence_value = sentence_value.replace("*", ",");

        let array_values: Array<string> = sentence_value.split(",");

        if(array_values[6] == "V") return;//Status Indicator, ‘A’ = Data valid, ‘V’ = Data not validnot valid
        if(array_values[7] == "N") return;//‘A’ = Autonomous mode, ‘D’ = Differential mode, ‘E’ = Estimated (dead reckoning) mode, ‘M’ = Manual input mode, ‘S’ = Simulator mode, ‘N’ = Data not valid

        var north_south: string = array_values[2];
        let latitude: string = this.transform_raw_data_into_coordinates(array_values[1]);
        if(north_south == "S"){latitude = "-" + latitude;}
        
        let east_west: string = array_values[4];
        let longitude: string = this.transform_raw_data_into_coordinates(array_values[3]);
        if(east_west == "W"){longitude = "-" + longitude;}

        //location
        this.new_variable_to_be_inserted.location = {};
        this.new_variable_to_be_inserted.location.lat = parseFloat(latitude);
        this.new_variable_to_be_inserted.location.lng = parseFloat(longitude);

        //MAPLINK
        var geography_coordinates: string = latitude + "," + longitude;
        var tmpLINK: string = this.mapLINK + geography_coordinates;

        this.new_variable_to_be_inserted.metadata.url_pin = {};
        this.new_variable_to_be_inserted.metadata.url_pin.url = tmpLINK;
        this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + geography_coordinates;
        this.new_variable_to_be_inserted.metadata.link = tmpLINK;

        //MORE METADATA
        this.new_variable_to_be_inserted.metadata.lat = latitude;
        this.new_variable_to_be_inserted.metadata.lon = longitude;
    };





    public decode_gga(sentence_value: string): void{
        sentence_value = sentence_value.replace("*", ",");

        var array_values: Array<string> = sentence_value.split(",");
        if (array_values[6] == "0") return;
    
        let latitude: string = this.transform_raw_data_into_coordinates(array_values[2]);
        let north_south: string = array_values[3];
        if (north_south == "S") {latitude = "-" + latitude;}

        var longitude: string = this.transform_raw_data_into_coordinates(array_values[4]);
        var east_west: string = array_values[5];
        if (east_west == "W") longitude = "-" + longitude;

        let tmpALT: string = array_values[9];
    
    
        //location
        this.new_variable_to_be_inserted.location = {};
        this.new_variable_to_be_inserted.location.lat = parseFloat(latitude);
        this.new_variable_to_be_inserted.location.lng = parseFloat(longitude);
    
        //MAPLINK
        var geography_coordinates: string = latitude + "," + longitude;
        var tmpLINK: string = this.mapLINK + geography_coordinates;
        this.new_variable_to_be_inserted.metadata.url_pin = {};
        this.new_variable_to_be_inserted.metadata.url_pin.url = tmpLINK;
        this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + geography_coordinates;
        this.new_variable_to_be_inserted.metadata.link = tmpLINK;
    
        //MORE METADATA
        this.new_variable_to_be_inserted.metadata.lat = latitude;
        this.new_variable_to_be_inserted.metadata.lng = longitude;
        this.new_variable_to_be_inserted.metadata.alt = tmpALT;
    };





    public decode_zda(sentence_value: string): void{
        sentence_value = sentence_value.replace("*", ",");

        var array_values: Array<string> = sentence_value.split(",");

        var strDD: string = array_values[2];
        var strMM: string = array_values[3];
        var strYY: string = array_values[4];

        var strH: string = array_values[1].substring(0, 2);
        var strM: string = array_values[1].substring(2, 4);
        var strS: string = array_values[1].substring(4, 6);

        //DATE/TIME
        var date: string = strYY + "-" + strMM + "-" + strDD;
        var time: string = strH + ":" + strM + ":" + strS;
        var date_time: string = date + " " + time;
        this.new_variable_to_be_inserted.metadata.zda_time = date_time;
    };





    public decode_vtg(sentence_value: string): void{
      sentence_value = sentence_value.replace("*", ",");

      var array_values = sentence_value.split(",");
      //if (tmpSPLIT[9] == "N") return; //‘N’ = Data not valid
  
      var speed: string = array_values[7]; //Km/h
      var tmpCOG: string = array_values[1];
      let direction: string = this.get_cardinal_direction(parseInt(tmpCOG));
  

      this.new_variable_to_be_inserted.metadata.spd = speed;
      this.new_variable_to_be_inserted.metadata.cog = tmpCOG;
      this.new_variable_to_be_inserted.metadata.direction = direction;
    };





    public decode_psti20(sentence_value: string): void{
        let dr_cal: string = sentence_value.split(",")[2];
        let gyro_cal: string = sentence_value.split(",")[3];
    
        sentence_value = sentence_value.replace("*", ",");
    
        var array_values: Array<string> = sentence_value.split(",");
        sentence_value = "null";
        if (array_values[6] == "A") sentence_value = "GPS"; 
        if (array_values[6] == "E") sentence_value = "GPS-DR";
        if (array_values[6] == "N") sentence_value = "ERROR";
    
       
        if(sentence_value === "null" || sentence_value === "ERROR") { sentence_value = this.coordinates_origin }
    
    
        this.new_variable_to_be_inserted.metadata.origin = sentence_value;
        this.new_variable_to_be_inserted.metadata.dr_cal = Number(dr_cal);
        this.new_variable_to_be_inserted.metadata.gyro_cal = Number(gyro_cal);
    };





    //CBC = BATTERY
   public add_battery_field(sentence_value: string):void {
    //private method
    sentence_value = sentence_value.replace(":", ",");
    let array_values: Array<string> = sentence_value.split(",");
    let battery: number = parseInt(array_values[3]);
    battery = battery / 1000;
    
    this.new_variable_to_be_inserted.metadata.battery = battery;
  };





  public add_operator_field(sentence_value: any): void{
    //COPS =  OPERATORS
    sentence_value = sentence_value.replace("cops:", "");
    sentence_value = sentence_value.trim();
    this.new_variable_to_be_inserted.metadata.cops = sentence_value;
  };





  public add_jamming_state(sentence_value: string): void {
    //private method
    sentence_value = sentence_value.replace("SJDR: ", "");
    sentence_value = sentence_value.trim();
    this.new_variable_to_be_inserted.metadata.jamm = sentence_value;
  };

 



  public get_cardinal_direction(tmpFLOAT: number): string {
    //private method
    let direction: string = "NULL";

    //North
    if (tmpFLOAT >= 360 - 45 / 2 && tmpFLOAT <= 360 + 45 / 2) direction = "N";
    if (tmpFLOAT >= 0 - 45 / 2 && tmpFLOAT <= 0 + 45 / 2) direction = "N";
    //North-East
    if (tmpFLOAT >= 45 - 45 / 2 && tmpFLOAT <= 45 + 45 / 2) direction = "NE";
    //East
    if (tmpFLOAT >= 90 - 45 / 2 && tmpFLOAT <= 90 + 45 / 2) direction = "E";
    //South-East
    if (tmpFLOAT >= 135 - 45 / 2 && tmpFLOAT <= 135 + 45 / 2) direction = "SE";
    //South
    if (tmpFLOAT >= 180 - 45 / 2 && tmpFLOAT <= 180 + 45 / 2) direction = "S";
    //South-West
    if (tmpFLOAT >= 225 - 45 / 2 && tmpFLOAT <= 225 + 45 / 2) direction = "SW";
    //West
    if (tmpFLOAT >= 270 - 45 / 2 && tmpFLOAT <= 270 + 45 / 2) direction = "W";
    //North-West
    if (tmpFLOAT >= 315 - 45 / 2 && tmpFLOAT <= 315 + 45 / 2) direction = "NW";

    return direction;
  };


};

