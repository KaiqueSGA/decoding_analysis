/* 
   Script purpose: This script stores a class called gps_sentences. This class is responsible per decode all GPS sentences sent by device.
   These sentences are sent by device just through of communication protocol MQTT.
   To know better about the decoding of each sentence, you need to read the handbook of GPS module.
   
   The device sent these sentences through of a big string, when each field is separeted by: ";", and the separetion between field and value is separeted by ","
   ex:esn;0-4242117;model,AT-G1018;hmv,0.1M4;fmv,0.8M4;mode,BEACON;media,GSM/GPRS;rtc,2023-03-24 18:40:23;battery_volts,3.84;imei,869951032048823;iccid,8944500601200071406F;cops,CLARO BR;jamm,+SJDR: NO JAMMING;rf_model,HC-12;rf_channel,001;rmc,$GNRMC,184028.000,V,2335.73047,S,04638.18496,W,000.0,000.0,240323,,,N,V*15;vtg,$GNVTG,000.0,T,,M,000.0,N,000.0,K,N*1C;zda,$GNZDA,180528.000,04,09,2023,00,00*49;psti20,$PSTI,20,0,1,1,0,N,1,0,-1.04,100.00,0.00,0.00*7A;psti60,$PSTI,060,0,V,0.00,34.16,0.00,,,,,,,,*60;psti63,$PSTI,063,G,0.52,-0.01,0.29,C,0.53,-0.01,0.28*03;psti65,$PSTI,065,A,0.85,-8.09,5.50,N,0.00,0.00,0.00*2F;psti70,$PSTI,070,T,I,57.6*2E;mac0,08:a7:c0:76:13:10;mac1,c0:3d:d9:10:79:f0;mac2,ce:32:e5:21:0b:80;lbs_mode,LTE;lbs0,LBS0,9610,290,-93,-56,-18,-8,46111,28560395,724,05,255
       model:AT-g1018
       hmv:0.8m4
       zda:$GNZDA,180528.000,04,09,2023,00,00*49
   */


import { location_apis } from "../../Apis/location";


export class gps_sentences {
    private coordinates_origin: string = "";
    public new_variable_to_be_inserted: any;
    //decoded_message: any;
    private mapLINK: string = "https://www.google.com/maps/search/?api=1&query=";

    constructor(new_variable_to_be_inserted: any){
        this.new_variable_to_be_inserted = new_variable_to_be_inserted;
    };
   

    public decode_gns(sentence_value: string): void{//public method
        sentence_value = sentence_value.replace("*", ",");
        sentence_value = sentence_value.replace(":", ",");
    
        var tmpSPLIT: Array<string> = sentence_value.split(",");
    
        //fix mode: 0,1,2
        var tmpFIX: string = tmpSPLIT[9];
        if (tmpFIX == '0') return; //new_variable_to_be_inserted.metadata.ORIGIN = "ERR";
        if (tmpFIX == '1') this.new_variable_to_be_inserted.metadata.origin = "GPS";
        if (tmpFIX == '2') this.new_variable_to_be_inserted.metadata.origin = "GPS-DR";
    
        //location
        this.new_variable_to_be_inserted.location = {};
        this.new_variable_to_be_inserted.location.lat = parseFloat(tmpSPLIT[4]);
        this.new_variable_to_be_inserted.location.lng = parseFloat(tmpSPLIT[5]);
    
        //MAPLINK
        var tmpLATLON: number = Number(tmpSPLIT[4] + "," + tmpSPLIT[5]);
        this.new_variable_to_be_inserted.metadata.url_pin = {};
        this.new_variable_to_be_inserted.metadata.url_pin.url = tmpLATLON;
        this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.link = tmpLATLON;
    
        //MORE METADATA
        this.new_variable_to_be_inserted.metadata.lat = tmpSPLIT[4]; //field name to lowercase
        this.new_variable_to_be_inserted.metadata.lon = tmpSPLIT[5]; //field name to lowercase
        this.new_variable_to_be_inserted.metadata.alt = tmpSPLIT[6]; //field name to lowercase
        this.new_variable_to_be_inserted.metadata.spd = tmpSPLIT[7]; //field name to lowercase
        this.new_variable_to_be_inserted.metadata.cog = tmpSPLIT[8]; //field name to lowercase
    
        //DIR = Cardinals
        var tmpCOG = this.new_variable_to_be_inserted.metadata.cog; //field name to lowercase
        var tmpFLOAT: number = 0.0;
        var tmpDIR: string = "";
        tmpFLOAT = parseInt(tmpCOG);
        tmpDIR = this.get_cardinal_direction(tmpFLOAT);
        this.new_variable_to_be_inserted.metadata.direction = tmpDIR;
    
        //DATE/TIME
        var tmpDATE =
          tmpSPLIT[3].substring(0, 4) +
          "-" +
          tmpSPLIT[3].substring(4, 6) +
          "-" +
          tmpSPLIT[3].substring(6, 8) +
          "T";
        var tmpTIME =
          tmpSPLIT[3].substring(8, 10) +
          ":" +
          tmpSPLIT[3].substring(10, 12) +
          ":" +
          tmpSPLIT[3].substring(12, 14);
        var tmpDATETIME = tmpDATE + tmpTIME;
        this.new_variable_to_be_inserted.metadata.rtc = tmpDATETIME;
    };





    public decode_gps166(sentence_value: string): string{//public method
        var tmpFLOAT: number = parseFloat(sentence_value);
        tmpFLOAT = tmpFLOAT / 100;

        var tmpINT: number = parseInt(String(tmpFLOAT));

        tmpFLOAT = tmpFLOAT - tmpINT;
        tmpFLOAT = tmpFLOAT / 0.6;
        tmpFLOAT = tmpFLOAT + tmpINT;

        sentence_value = String(tmpFLOAT.toFixed(8)); //8 = Better Results

        return sentence_value;
    };





    public async decode_rmc(sentence_value: string): Promise<void>{
        var location_functions = new location_apis();

        sentence_value = sentence_value.replace("*", ",");
        var tmpSPLIT: Array<string> = sentence_value.split(",");
    
    
        var mac_coordinates: any = this.new_variable_to_be_inserted.metadata.mac0 ?await location_functions.get_coordinates_through_mac_datas( ["mac0", "mac1", "mac2"], this.new_variable_to_be_inserted ) :{lat:0, lng:0};
        var lbs_coordinates: any = this.new_variable_to_be_inserted.metadata.lbs0 ?await location_functions.get_coordinates_through_lbs_datas( ["lbs0", "lbs1", "lbs2"], this.new_variable_to_be_inserted, this.new_variable_to_be_inserted.metadata.lbs_mode === "LTE" ?"lte" :"gsm" ) :{lat:0, lng:0}; 
    
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
    
    
    
        if(tmpSPLIT[12] == "N") {
          
          if(mac_coordinates.lat === 0  &&  lbs_coordinates.lat === 0){ process.kill(process.pid, 'SIGINT'); return;  }
    
          let coordinates = mac_coordinates.lat != 0 ?mac_coordinates :lbs_coordinates;
          this.coordinates_origin = mac_coordinates.lat != 0   ?"MAC"  :"LBS";
    
           if(coordinates.lat === 0 || coordinates.lng === 0){
            let tmpLAT: string = tmpSPLIT[3];
            let tmpLON: string = tmpSPLIT[5];
    
            let tmpNS: string = tmpSPLIT[4];
            var tmpEW: string = tmpSPLIT[6];
    
            tmpLAT = this.decode_gps166(tmpLAT);
            if(tmpNS == "S") { coordinates.lat = "-" + tmpLAT; }
        
            tmpLON = this.decode_gps166(tmpLON);
            if(tmpEW == "W") { coordinates.lng = "-" + tmpLON; }
          } 
    
    
    
          var tmpSPD: string = tmpSPLIT[7];
          var tmpCOG: string = tmpSPLIT[8];
          var tmpFLOAT: number = 0.0;
          var tmpDIR: string = "";
          var tmpIEC: string = tmpSPLIT[13];
    
          this.new_variable_to_be_inserted.location = { type:"Point", coordinates:[ coordinates.lng, coordinates.lat]};
    
          this.new_variable_to_be_inserted.metadata.url_pin = {};
          this.new_variable_to_be_inserted.metadata.url_pin.url = this.mapLINK + coordinates.lat + "," + coordinates.lng;
          this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + coordinates.lat + "," + coordinates.lng;
          this.new_variable_to_be_inserted.metadata.link = this.mapLINK + coordinates.lat + "," + coordinates.lng;
          
          var knot = 1.852;
          tmpSPD = (parseInt(tmpSPD) * knot).toFixed(1);
      
          //COG = Course Over the Ground to DIR 👎�
          tmpFLOAT = parseInt(tmpCOG);
          tmpDIR = this.get_cardinal_direction(tmpFLOAT);
      
    
          this.new_variable_to_be_inserted.metadata.lat = coordinates.lat; 
          this.new_variable_to_be_inserted.metadata.lon = coordinates.lng; 
          this.new_variable_to_be_inserted.metadata.spd = tmpSPD; 
          this.new_variable_to_be_inserted.metadata.cog = tmpCOG;
          this.new_variable_to_be_inserted.metadata.direction = tmpDIR;
          this.new_variable_to_be_inserted.metadata.IEC = tmpIEC;
          this.new_variable_to_be_inserted.metadata.address = await location_functions.get_address_through_coordinates(coordinates.lat, coordinates.lng);
    
          return;
        }
    
        else{
    
        var tmpLAT: string = tmpSPLIT[3];
        var tmpNS: string = tmpSPLIT[4];
        var tmpLON: string = tmpSPLIT[5];
        var tmpEW: string = tmpSPLIT[6];
        var tmpSPD: string = tmpSPLIT[7];
        var tmpCOG: string = tmpSPLIT[8];
        var tmpFLOAT: number = 0.0;
        var tmpDIR: string = "";
    
        var tmpIEC: string = tmpSPLIT[13];
    
        tmpLAT = this.decode_gps166(tmpLAT);
        if (tmpNS == "S") tmpLAT = "-" + tmpLAT;
    
        tmpLON = this.decode_gps166(tmpLON);
        if (tmpEW == "W") tmpLON = "-" + tmpLON;
    
        //location
        this.new_variable_to_be_inserted.location = {};
        this.new_variable_to_be_inserted.location = { type:"Point", coordinates:[ parseFloat(tmpLON), parseFloat(tmpLAT)]};
      
    
        //MAPLINK
        var tmpLATLON: string = tmpLAT + "," + tmpLON;
        var tmpLINK: string = this.mapLINK + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.url_pin = {};
        this.new_variable_to_be_inserted.metadata.url_pin.url = tmpLINK;
        this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.link = tmpLINK; 
    
        //Speed from knots to Km/h
        var knot: number = 1.852;
        tmpSPD = (parseInt(tmpSPD) * knot).toFixed(1);
    
        //COG = Course Over the Ground to DIR 👎�
        tmpFLOAT = parseInt(tmpCOG);
        tmpDIR = this.get_cardinal_direction(tmpFLOAT);
     
        
        //MORE METADATA
        this.new_variable_to_be_inserted.metadata.lat = tmpLAT; 
        this.new_variable_to_be_inserted.metadata.lon = tmpLON; 
        this.new_variable_to_be_inserted.metadata.spd = tmpSPD; 
        this.new_variable_to_be_inserted.metadata.cog = tmpCOG;
        this.new_variable_to_be_inserted.metadata.direction = tmpDIR;
        this.new_variable_to_be_inserted.metadata.IEC = tmpIEC;
        this.new_variable_to_be_inserted.metadata.address = await location_functions.get_address_through_coordinates(tmpLAT, tmpLON);
        }
    };





    public decode_gll(sentence_value: string): void{
        sentence_value = sentence_value.replace("*", ",");

        var tmpSPLIT: Array<string> = sentence_value.split(",");

        if (tmpSPLIT[6] == "V") return;
        /*
        Status Indicator, ‘A’ = Data valid, ‘V’ = Data not validnot valid
        */

        if (tmpSPLIT[7] == "N") return;
        /*
        Mode indicator
        ‘A’ = Autonomous mode
        ‘D’ = Differential mode
        ‘E’ = Estimated (dead reckoning) mode
        ‘M’ = Manual input mode
        ‘S’ = Simulator mode
        ‘N’ = Data not valid
        */

        var tmpLAT: string = tmpSPLIT[1];
        var tmpNS: string = tmpSPLIT[2];
        var tmpLON: string = tmpSPLIT[3];
        var tmpEW: string = tmpSPLIT[4];

        tmpLAT = this.decode_gps166(tmpLAT);
        if (tmpNS == "S") tmpLAT = "-" + tmpLAT;

        tmpLON = this.decode_gps166(tmpLON);
        if (tmpEW == "W") tmpLON = "-" + tmpLON;

        //location
        this.new_variable_to_be_inserted.location = {};
        this.new_variable_to_be_inserted.location.lat = parseFloat(tmpLAT);
        this.new_variable_to_be_inserted.location.lng = parseFloat(tmpLON);

        //MAPLINK
        var tmpLATLON: string = tmpSPLIT[3] + "," + tmpSPLIT[4];
        var tmpLINK: string = this.mapLINK + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.url_pin = {};
        this.new_variable_to_be_inserted.metadata.url_pin.url = tmpLINK;
        this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.link = tmpLINK;

        //MORE METADATA
        this.new_variable_to_be_inserted.metadata.lat = tmpLAT;
        this.new_variable_to_be_inserted.metadata.lon = tmpLON;
    };





    public decode_gga(sentence_value: string): void{
        sentence_value = sentence_value.replace("*", ",");

        var tmpSPLIT: Array<string> = sentence_value.split(",");
        if (tmpSPLIT[6] == "0") return;
    
        var tmpLAT: string = tmpSPLIT[2];
        var tmpNS: string = tmpSPLIT[3];
        var tmpLON: string = tmpSPLIT[4];
        var tmpEW: string = tmpSPLIT[5];
        var tmpALT: string = tmpSPLIT[9];
    
        tmpLAT = this.decode_gps166(tmpLAT);
        if (tmpNS == "S") tmpLAT = "-" + tmpLAT;
    
        tmpLON = this.decode_gps166(tmpLON);
        if (tmpEW == "W") tmpLON = "-" + tmpLON;
    
        //location
        this.new_variable_to_be_inserted.location = {};
        this.new_variable_to_be_inserted.location.lat = parseFloat(tmpLAT);
        this.new_variable_to_be_inserted.location.lng = parseFloat(tmpLON);
    
        //MAPLINK
        var tmpLATLON: string = tmpSPLIT[3] + "," + tmpSPLIT[4];
        var tmpLINK: string = this.mapLINK + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.url_pin = {};
        this.new_variable_to_be_inserted.metadata.url_pin.url = tmpLINK;
        this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.link = tmpLINK;
    
        //MORE METADATA
        this.new_variable_to_be_inserted.metadata.lat = tmpLAT;
        this.new_variable_to_be_inserted.metadata.lng = tmpLON;
        this.new_variable_to_be_inserted.metadata.alt = tmpALT;
    };





    public decode_zda(sentence_value: string): void{
        sentence_value = sentence_value.replace("*", ",");

        var tmpSPLIT: Array<string> = sentence_value.split(",");

        var strDD: string = tmpSPLIT[2];
        var strMM: string = tmpSPLIT[3];
        var strYY: string = tmpSPLIT[4];

        var strH: string = tmpSPLIT[1].substring(0, 2);
        var strM: string = tmpSPLIT[1].substring(2, 4);
        var strS: string = tmpSPLIT[1].substring(4, 6);

        //DATE/TIME
        var tmpDATE: string = strYY + "-" + strMM + "-" + strDD;
        var tmpTIME: string = strH + ":" + strM + ":" + strS;
        var tmpDATETIME: string = tmpDATE + " " + tmpTIME;
        this.new_variable_to_be_inserted.metadata.zda_time = tmpDATETIME;
    };





    public decode_vtg(sentence_value: string): void{
      sentence_value = sentence_value.replace("*", ",");

      var tmpSPLIT = sentence_value.split(",");
      //if (tmpSPLIT[9] == "N") return; //‘N’ = Data not valid
  
      var tmpSPD: string = tmpSPLIT[7]; //Km/h
      var tmpCOG: string = tmpSPLIT[1];
      var tmpFLOAT: number = 0.0;
      var tmpDIR: string = "";
  
      tmpFLOAT = parseInt(tmpCOG);
      tmpDIR = this.get_cardinal_direction(tmpFLOAT);
  
      this.new_variable_to_be_inserted.metadata.spd = tmpSPD;
      this.new_variable_to_be_inserted.metadata.cog = tmpCOG;
      this.new_variable_to_be_inserted.metadata.direction = tmpDIR;
    };





    public decode_psti20(sentence_value: string): void{
        let dr_cal: string = sentence_value.split(",")[2];
        let gyro_cal: string = sentence_value.split(",")[3];
    
        sentence_value = sentence_value.replace("*", ",");
    
        var tmpSPLIT: Array<string> = sentence_value.split(",");
        sentence_value = "null";
        if (tmpSPLIT[6] == "A") sentence_value = "GPS"; 
        if (tmpSPLIT[6] == "E") sentence_value = "GPS-DR";
        if (tmpSPLIT[6] == "N") sentence_value = "ERROR";
    
       
        if(sentence_value === "null" || sentence_value === "ERROR") { sentence_value = this.coordinates_origin }
    
    
        this.new_variable_to_be_inserted.metadata.origin = sentence_value;
        this.new_variable_to_be_inserted.metadata.dr_cal = Number(dr_cal);
        this.new_variable_to_be_inserted.metadata.gyro_cal = Number(gyro_cal);
    };





    //CBC = BATTERY
   public add_battery_field(sentence_value: string):void {
    //private method
    sentence_value = sentence_value.replace(":", ",");
    var tmpSPLIT: Array<string> = sentence_value.split(",");
    var tmpFLOAT: number = parseInt(tmpSPLIT[3]);
    tmpFLOAT = tmpFLOAT / 1000;
    
    this.new_variable_to_be_inserted.metadata.battery = tmpFLOAT;
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
    var tmpDIR: string = "NULL";

    //North
    if (tmpFLOAT >= 360 - 45 / 2 && tmpFLOAT <= 360 + 45 / 2) tmpDIR = "N";
    if (tmpFLOAT >= 0 - 45 / 2 && tmpFLOAT <= 0 + 45 / 2) tmpDIR = "N";
    //North-East
    if (tmpFLOAT >= 45 - 45 / 2 && tmpFLOAT <= 45 + 45 / 2) tmpDIR = "NE";
    //East
    if (tmpFLOAT >= 90 - 45 / 2 && tmpFLOAT <= 90 + 45 / 2) tmpDIR = "E";
    //South-East
    if (tmpFLOAT >= 135 - 45 / 2 && tmpFLOAT <= 135 + 45 / 2) tmpDIR = "SE";
    //South
    if (tmpFLOAT >= 180 - 45 / 2 && tmpFLOAT <= 180 + 45 / 2) tmpDIR = "S";
    //South-West
    if (tmpFLOAT >= 225 - 45 / 2 && tmpFLOAT <= 225 + 45 / 2) tmpDIR = "SW";
    //West
    if (tmpFLOAT >= 270 - 45 / 2 && tmpFLOAT <= 270 + 45 / 2) tmpDIR = "W";
    //North-West
    if (tmpFLOAT >= 315 - 45 / 2 && tmpFLOAT <= 315 + 45 / 2) tmpDIR = "NW";

    return tmpDIR;
  };


};

