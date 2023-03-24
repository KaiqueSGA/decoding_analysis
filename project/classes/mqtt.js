const ftp_and_tago_function = require("./ftp_and_tago_functions");
const location_api = require("./Apis/location");


class mqtt_message /* extends ftp_and_tago_function */{
    mapLINK = "https://www.google.com/maps/search/?api=1&query=";
    esn;
  
    constructor(/* xml_file_name, ftp_connection, */esn){
        /* super(xml_file_name, ftp_connection); */

        this.esn = esn;
    }



    //CBC = BATTERY
   add_battery_field = (tmpSTR)=> {//private method
    tmpSTR = tmpSTR.replace(":", ",");
    var tmpSPLIT = tmpSTR.split(",");
    var tmpFLOAT = tmpSPLIT[3];
    tmpFLOAT = tmpFLOAT / 1000;
    this.esn.metadata.battery = tmpFLOAT;
  }





  add_operator_field = (tmpSTR)=> {//COPS =  OPERATORS
    tmpSTR = tmpSTR.replace("cops:", "");
    tmpSTR = tmpSTR.trim();
    this.esn.metadata.cops = tmpSTR;
  }





  add_jamming_state = (tmpSTR)=> {//private method
    tmpSTR = tmpSTR.replace("sjdr:", "");
    tmpSTR = tmpSTR.trim();
    this.esn.metadata.jamm = tmpSTR;
  }
       
   
   

  
  get_cardinal_direction = (tmpFLOAT) => {//private method
      var tmpDIR = "NULL";

      //North
      if ((tmpFLOAT >= 360 - 45 / 2) && (tmpFLOAT <= 360 + 45 / 2)) tmpDIR = "N";
      if ((tmpFLOAT >= 0 - 45 / 2) && (tmpFLOAT <= 0 + 45 / 2)) tmpDIR = "N";
      //North-East
      if ((tmpFLOAT >= 45 - 45 / 2) && (tmpFLOAT <= 45 + 45 / 2)) tmpDIR = "NE";
      //East
      if ((tmpFLOAT >= 90 - 45 / 2) && (tmpFLOAT <= 90 + 45 / 2)) tmpDIR = "E";
      //South-East
      if ((tmpFLOAT >= 135 - 45 / 2) && (tmpFLOAT <= 135 + 45 / 2)) tmpDIR = "SE";
      //South
      if ((tmpFLOAT >= 180 - 45 / 2) && (tmpFLOAT <= 180 + 45 / 2)) tmpDIR = "S";
      //South-West
      if ((tmpFLOAT >= 225 - 45 / 2) && (tmpFLOAT <= 225 + 45 / 2)) tmpDIR = "SW";
      //West
      if ((tmpFLOAT >= 270 - 45 / 2) && (tmpFLOAT <= 270 + 45 / 2)) tmpDIR = "W";
      //North-West
      if ((tmpFLOAT >= 315 - 45 / 2) && (tmpFLOAT <= 315 + 45 / 2)) tmpDIR = "NW";

      return tmpDIR;
    }
  
  
  
  
  //GNS / UGNSINF = PROPRIETERY GNS (GPS DATA)fncGNS
   fncGNS = (tmpSTR)=> {//private method
    tmpSTR = tmpSTR.replace("*", ",");
    tmpSTR = tmpSTR.replace(":", ",");

    var tmpSPLIT = tmpSTR.split(",");

    //fix mode: 0,1,2
    var tmpFIX = tmpSPLIT[9];
    if (tmpFIX == 0) return; //esn.metadata.ORIGIN = "ERR";
    if (tmpFIX == 1) esn.metadata.origin = "GPS";
    if (tmpFIX == 2) esn.metadata.origin = "GPS-DR";

    //location
    this.esn.location = {};
    this.esn.location.lat = parseFloat(tmpSPLIT[4]);
    this.esn.location.lng = parseFloat(tmpSPLIT[5]);

    //MAPLINK
    var tmpLATLON = Number(tmpSPLIT[4] + "," + tmpSPLIT[5]);
    this.esn.metadata.url_pin = {};
    this.esn.metadata.url_pin.url = tmpLATLON;
    this.esn.metadata.url_pin.alias = "Open map at " + tmpLATLON;
    this.esn.metadata.link = tmpLATLON;

    //MORE METADATA
    this.esn.metadata.lat = tmpSPLIT[4];//field name to lowercase
    this.esn.metadata.lon = tmpSPLIT[5];//field name to lowercase
    this.esn.metadata.alt = tmpSPLIT[6];//field name to lowercase
    this.esn.metadata.spd = tmpSPLIT[7];//field name to lowercase
    this.esn.metadata.cog = tmpSPLIT[8];//field name to lowercase

    //DIR = Cardinals
    var tmpCOG = esn.metadata.cog;//field name to lowercase
    var tmpFLOAT = 0.00;
    var tmpDIR = "";
    tmpFLOAT = parseInt(tmpCOG);
    tmpDIR = this.get_cardinal_direction(tmpFLOAT);
    this.esn.metadata.direction = tmpDIR

    //DATE/TIME
    var tmpDATE = tmpSPLIT[3].substring(0, 4) + "-" + tmpSPLIT[3].substring(4, 6) + "-" + tmpSPLIT[3].substring(6, 8) + "T";
    var tmpTIME = tmpSPLIT[3].substring(8, 10) + ":" + tmpSPLIT[3].substring(10, 12) + ":" + tmpSPLIT[3].substring(12, 14);
    var tmpDATETIME = tmpDATE + tmpTIME;
    this.esn.metadata.RTC = tmpDATETIME;
  }




  //GPS NMEA coordinates to Google Maps coordinates
  fncGPS166  = (tmpSTR)=> {//private method
    var tmpFLOAT = parseFloat(tmpSTR);
    tmpFLOAT = tmpFLOAT / 100;

    var tmpINT = parseInt(String(tmpFLOAT));

    tmpFLOAT = tmpFLOAT - tmpINT;
    tmpFLOAT = tmpFLOAT / 0.6;
    tmpFLOAT = tmpFLOAT + tmpINT;

    tmpSTR = String(tmpFLOAT.toFixed(8)); //8 = Better Results

    return tmpSTR;
  }




  //RMC = Recommended Minimum Specific GNSS Data
  fncRMC = (tmpSTR)=> {//private method
    tmpSTR = tmpSTR.replace("*", ",");

    var tmpSPLIT = tmpSTR.split(",");

    if (tmpSPLIT[12] == "N") return;
    /*
    Mode indicator D Mode indicator
    ‘A’ = Autonomous mode
    ‘D’ = Differential mode
    ‘E’ = Estimated (dead reckoning) mode
    ‘F’ = Float RTK. Satellite system used in RTK mode, floating integers
    ‘M’ = Manual Input Mode
    ‘N’ = Data not valid
    ‘P’ = Precise
    ‘R’ = Real Time Kinematic. System used in RTK mode with fixed integers
    ‘S’ = Simulator Mode
    */

    var tmpLAT = tmpSPLIT[3];
    var tmpNS = tmpSPLIT[4];
    var tmpLON = tmpSPLIT[5];
    var tmpEW = tmpSPLIT[6];
    var tmpSPD = tmpSPLIT[7];
    var tmpCOG = tmpSPLIT[8];
    var tmpFLOAT = 0.00;
    var tmpDIR = "";

    var tmpIEC = tmpSPLIT[13];
    /*
    Navigation status Navigation status indicator according to IEC61108 requirement
    on ‘Navigational (or Failure) warnings and status indicators’.
    ‘S’ = Safe
    ‘C’ = Caution
    ‘U’ = Unsafe
    ‘V’ = Navigation status not valid, equipment is not providing navigation status indicator.
    */

    tmpLAT = this.fncGPS166(tmpLAT);
    if (tmpNS == "S") tmpLAT = "-" + tmpLAT;

    tmpLON = this.fncGPS166(tmpLON);
    if (tmpEW == "W") tmpLON = "-" + tmpLON;

    //location
    this.esn.location = {};
    this.esn.location.lat = parseFloat(tmpLAT);
    this.esn.location.lng = parseFloat(tmpLON);

    //MAPLINK
    var tmpLATLON = tmpLAT + "," + tmpLON;
    var tmpLINK = this.mapLINK + tmpLATLON;
    this.esn.metadata.url_pin = {};
    this.esn.metadata.url_pin.url = tmpLINK;
    this.esn.metadata.url_pin.alias = "Open map at " + tmpLATLON;
    this.esn.metadata.link = tmpLINK;//field name to lowercase

    //Speed from knots to Km/h
    var knot = 1.85200;
    tmpSPD = tmpSPD * knot;
    tmpSPD = tmpSPD.toFixed(1)

    //COG = Course Over the Ground to DIR 👎�
    tmpFLOAT = parseInt(tmpCOG);
    tmpDIR = this.get_cardinal_direction(tmpFLOAT);

    //MORE METADATA
    this.esn.metadata.lat = tmpLAT;//field name to lowercase
    this.esn.metadata.lon = tmpLON;//field name to lowercase
    this.esn.metadata.spd = tmpSPD;//field name to lowercase
    this.esn.metadata.cog = tmpCOG;
    this.esn.metadata.direction = tmpDIR;
    this.esn.metadata.IEC = tmpIEC;
  }




    //GLL = Latitude/Longitude of current position, time, and status.
    fncGLL = (tmpSTR)=> {//private method
      tmpSTR = tmpSTR.replace("*", ",");

      var tmpSPLIT = tmpSTR.split(",");

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

      var tmpLAT = tmpSPLIT[1];
      var tmpNS = tmpSPLIT[2];
      var tmpLON = tmpSPLIT[3];
      var tmpEW = tmpSPLIT[4];

      tmpLAT = this.fncGPS166(tmpLAT);
      if (tmpNS == "S") tmpLAT = "-" + tmpLAT;

      tmpLON = this.fncGPS166(tmpLON);
      if (tmpEW == "W") tmpLON = "-" + tmpLON;

      //location
      esn.location = {};
      esn.location.lat = parseFloat(tmpLAT);
      esn.location.lng = parseFloat(tmpLON);

      //MAPLINK
      var tmpLATLON = tmpSPLIT[3] + "," + tmpSPLIT[4];
      var tmpLINK = mapLINK + tmpLATLON;
      esn.metadata.url_pin = {};
      esn.metadata.url_pin.url = tmpLINK;
      esn.metadata.url_pin.alias = "Open map at " + tmpLATLON;
      esn.metadata.link = tmpLINK;

      //MORE METADATA
      this.esn.metadata.lat = tmpLAT;
      this.esn.metadata.lon = tmpLON;
    }




    //GGA = Global Positioning System Fix Data
    fncGGA = (tmpSTR)=> {//private method
      tmpSTR = tmpSTR.replace("*", ",");

      var tmpSPLIT = tmpSTR.split(",");
      if (tmpSPLIT[6] == "0") return;
      /*
      GPS quality indicator
      0: position fix unavailable
      1: valid position fix, SPS mode
      2: valid position fix, differential GPS mode
      3: GPS PPS Mode, fix valid
      4: Real Time Kinematic. System used in RTK mode with fixed integers
      5: Float RTK. Satellite system used in RTK mode., floating integers
      6: Estimated (dead reckoning) Mode
      7: Manual Input Mode
      8: Simulator Mode
      */

      var tmpLAT = tmpSPLIT[2];
      var tmpNS = tmpSPLIT[3];
      var tmpLON = tmpSPLIT[4];
      var tmpEW = tmpSPLIT[5];
      var tmpALT = tmpSPLIT[9];

      tmpLAT = this.fncGPS166(tmpLAT);
      if (tmpNS == "S") tmpLAT = "-" + tmpLAT;

      tmpLON = this.fncGPS166(tmpLON);
      if (tmpEW == "W") tmpLON = "-" + tmpLON;

      //location
      esn.location = {};
      esn.location.lat = parseFloat(tmpLAT);
      esn.location.lng = parseFloat(tmpLON);

      //MAPLINK
      var tmpLATLON = tmpSPLIT[3] + "," + tmpSPLIT[4];
      var tmpLINK = mapLINK + tmpLATLON;
      this.esn.metadata.url_pin = {};
      this.esn.metadata.url_pin.url = tmpLINK;
      this.esn.metadata.url_pin.alias = "Open map at " + tmpLATLON;
      this.esn.metadata.link = tmpLINK;

      //MORE METADATA
      this.esn.metadata.lat = tmpLAT;
      this.esn.metadata.lng = tmpLON;
      this.esn.metadata.alt = tmpALT;
    }
   

   
   
     
     get_rtc_time = (tmpSTR)=> {
      tmpSTR = tmpSTR.replace("*", ",");

      var tmpSPLIT = tmpSTR.split(",");

      var strDD = tmpSPLIT[2];
      var strMM = tmpSPLIT[3];
      var strYY = tmpSPLIT[4];

      var strH = tmpSPLIT[1].substring(0, 2);
      var strM = tmpSPLIT[1].substring(2, 4);
      var strS = tmpSPLIT[1].substring(4, 6);

      //DATE/TIME
      var tmpDATE = strYY + "-" + strMM + "-" + strDD;
      var tmpTIME = strH + ":" + strM + ":" + strS;
      var tmpDATETIME = tmpDATE + " " + tmpTIME;
      this.esn.metadata.rtc = tmpDATETIME;
    }
    
   
   
   
  //VTG = Course Over Ground and Ground Speed
  fncVTG = (tmpSTR) => {//private method
    tmpSTR = tmpSTR.replace("*", ",");

    var tmpSPLIT = tmpSTR.split(",");
    if (tmpSPLIT[9] == "N") return; //‘N’ = Data not valid

    var tmpSPD = tmpSPLIT[7]; //Km/h
    var tmpCOG = tmpSPLIT[1];
    var tmpFLOAT = 0.00;
    var tmpDIR = "";

    tmpFLOAT = parseInt(tmpCOG);
    tmpDIR = this.get_cardinal_direction(tmpFLOAT);

    this.esn.metadata.spd = tmpSPD;
    this.esn.metadata.cog = tmpCOG;
    this.esn.metadata.direction = tmpDIR;
  }
  
  
  
  
  //PSTI20 = Dead Reckoning Status Message
  get_message_origin = (tmpSTR)=> {//private method
    tmpSTR = tmpSTR.replace("*", ",");

    var tmpSPLIT = tmpSTR.split(",");
    tmpSTR = "NULL";
    if (tmpSPLIT[6] == "A") tmpSTR = "GPS";
    if (tmpSPLIT[6] == "E") tmpSTR = "GPS-DR";
    if (tmpSPLIT[6] == "N") tmpSTR = "ERROR";
    this.esn.metadata.origin = tmpSTR;
  }






  decode = async(scope)=> {//public method
   
            var values_array = this.esn.value.split(";");//The device send a string with many values inside of field value(these values are represanting an object, this is the structure: ESN,176823;battery,good;), each 'field' is separeted by ";" and the field key and its value are separeted by "," .
                
            this.esn.variable = values_array[0] //Rename VAR
            this.esn.value = values_array[1] //Update Value

              
            for (let i = 2; i < values_array.length; i++) {//I'm starting by the value 2 because the 2 first fields aren't necessary to this part of code
                values_array[i] = values_array[i].replace("+", "");

                var field_key = (values_array[i].split(",")[0]).trim();
                var field_value = values_array[i].replace(field_key + ",", "").trim();


                if(field_key == "EOF") { i = values_array.length };

                this.esn.metadata[field_key.toLowerCase()] = field_value;

                  
                //Fields that need be calculated to find out its value
                if(field_key.startsWith("battery_volts")) { this.add_battery_field(field_value); }
                else if(field_key.startsWith("cops")) { this.add_operator_field(field_value); }
                else if(field_key.startsWith("jamm")) { this.add_jamming_state(field_value); }
                else if(field_key.startsWith("gns")) { this.fncGNS(field_value); } //SIM7000G Proprietary GPS Sentence
                else if (field_key.startsWith("rmc")) { this.fncRMC(field_value); }
                else if (field_key.startsWith("gll")) { this.fncGLL(field_value); }
                else if (field_key.startsWith("gga")) { this.fncGGA(field_value); }
                else if (field_key.startsWith("zda")) { this.get_rtc_time(field_value); }
                else if (field_key.startsWith("vtg")) { this.fncVTG(field_value); }
                else if (field_key.startsWith("psti20")) { this.get_message_origin(field_value); }
             }

             delete this.esn.metadata.mqtt_topic; //clean mqtt_topic
             delete this.esn.metadata.EOF; //clean EOF mark
                
            //Adjust variable date/time
            if(this.esn.metadata.RTC) {this.esn.time = this.esn.metadata.RTC};

             
          
            if(this.esn.location !== undefined){
              if(typeof(this.esn.location.lat) === "number" && typeof(this.esn.location.lng) === "number"){//If this coordinate exist, I´m going to use it in the Google localization functions
                const location_function = new location_api();
                this.esn.metadata.address =  await location_function.get_address_through_coordinates(this.esn.location.lat, this.esn.location.lng);
              }
            }
            
            else if(this.esn.metadata.mac0){
                const location_function = new location_api();
                const mac_coordinates = await location_function.get_coordinates_through_mac_datas(["mac0","mac1","mac2"], scope);
                this.esn.metadata.address = await location_function.get_address_through_coordinates(mac_coordinates.lat, mac_coordinates.lng);
                
                if(this.esn.location !== undefined){ this.esn.location.lat = mac_coordinates.lat; }
                if(this.esn.location !== undefined){ this.esn.location.lng = mac_coordinates.lng; }
                this.esn.metadata.lat = mac_coordinates.lat;
                this.esn.metadata.lon = mac_coordinates.lng;

            } 





            return this.esn;

    }
}



module.exports = mqtt_message;