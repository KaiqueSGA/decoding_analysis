const location = require("../../Apis/location");


class gps_sentences {
    new_variable_to_be_inserted;
    decoded_message;
    mapLINK = "https://www.google.com/maps/search/?api=1&query=";

    constructor(new_variable_to_be_inserted){
        this.new_variable_to_be_inserted = new_variable_to_be_inserted;
    };
   

    decode_gns(raw_message){//public method
        raw_message = raw_message.replace("*", ",");
        raw_message = raw_message.replace(":", ",");
    
        var tmpSPLIT = raw_message.split(",");
    
        //fix mode: 0,1,2
        var tmpFIX = tmpSPLIT[9];
        if (tmpFIX == 0) return; //new_variable_to_be_inserted.metadata.ORIGIN = "ERR";
        if (tmpFIX == 1) new_variable_to_be_inserted.metadata.origin = "GPS";
        if (tmpFIX == 2) new_variable_to_be_inserted.metadata.origin = "GPS-DR";
    
        //location
        this.new_variable_to_be_inserted.location = {};
        this.new_variable_to_be_inserted.location.lat = parseFloat(tmpSPLIT[4]);
        this.new_variable_to_be_inserted.location.lng = parseFloat(tmpSPLIT[5]);
    
        //MAPLINK
        var tmpLATLON = Number(tmpSPLIT[4] + "," + tmpSPLIT[5]);
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
        var tmpCOG = new_variable_to_be_inserted.metadata.cog; //field name to lowercase
        var tmpFLOAT = 0.0;
        var tmpDIR = "";
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





    decode_gps166(raw_message){//public method
        var tmpFLOAT = parseFloat(raw_message);
        tmpFLOAT = tmpFLOAT / 100;

        var tmpINT = parseInt(String(tmpFLOAT));

        tmpFLOAT = tmpFLOAT - tmpINT;
        tmpFLOAT = tmpFLOAT / 0.6;
        tmpFLOAT = tmpFLOAT + tmpINT;

        raw_message = String(tmpFLOAT.toFixed(8)); //8 = Better Results

        return raw_message;
    };





    async decode_rmc(raw_message){
        var location_functions = new location();

        raw_message = raw_message.replace("*", ",");
        var tmpSPLIT = raw_message.split(",");
    
    
        var mac_coordinates = this.new_variable_to_be_inserted.metadata.mac0 ?await location_functions.get_coordinates_through_mac_datas( ["mac0", "mac1", "mac2"], this.new_variable_to_be_inserted ) :{lat:0, lng:0};
        var lbs_coordinates = this.new_variable_to_be_inserted.metadata.lbs0 ?await location_functions.get_coordinates_through_lbs_datas( ["lbs0", "lbs1", "lbs2"], this.new_variable_to_be_inserted, this.new_variable_to_be_inserted.metadata.lbs_mode === "LTE" ?"lte" :"gsm" ) :{lat:0, lng:0}; 
    
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
            let tmpLAT = tmpSPLIT[3];
            let tmpLON = tmpSPLIT[5];
    
            let tmpNS = tmpSPLIT[4];
            var tmpEW = tmpSPLIT[6];
    
            tmpLAT = this.fncGPS166(tmpLAT);
            if(tmpNS == "S") { coordinates.lat = "-" + tmpLAT; }
        
            tmpLON = this.fncGPS166(tmpLON);
            if(tmpEW == "W") { coordinates.lng = "-" + tmpLON; }
          } 
    
    
    
          var tmpSPD = tmpSPLIT[7];
          var tmpCOG = tmpSPLIT[8];
          var tmpFLOAT = 0.0;
          var tmpDIR = "";
          var tmpIEC = tmpSPLIT[13];
    
          this.new_variable_to_be_inserted.location = { type:"Point", coordinates:[ coordinates.lng, coordinates.lat]};
    
          this.new_variable_to_be_inserted.metadata.url_pin = {};
          this.new_variable_to_be_inserted.metadata.url_pin.url = this.mapLINK + coordinates.lat + "," + coordinates.lng;
          this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + coordinates.lat + "," + coordinates.lng;
          this.new_variable_to_be_inserted.metadata.link = this.mapLINK + coordinates.lat + "," + coordinates.lng;
          
          var knot = 1.852;
          tmpSPD = tmpSPD * knot;
          tmpSPD = tmpSPD.toFixed(1);
      
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
    
        var tmpLAT = tmpSPLIT[3];
        var tmpNS = tmpSPLIT[4];
        var tmpLON = tmpSPLIT[5];
        var tmpEW = tmpSPLIT[6];
        var tmpSPD = tmpSPLIT[7];
        var tmpCOG = tmpSPLIT[8];
        var tmpFLOAT = 0.0;
        var tmpDIR = "";
    
        var tmpIEC = tmpSPLIT[13];
    
        tmpLAT = this.fncGPS166(tmpLAT);
        if (tmpNS == "S") tmpLAT = "-" + tmpLAT;
    
        tmpLON = this.fncGPS166(tmpLON);
        if (tmpEW == "W") tmpLON = "-" + tmpLON;
    
        //location
        this.new_variable_to_be_inserted.location = {};
        this.new_variable_to_be_inserted.location = { type:"Point", coordinates:[ parseFloat(tmpLON), parseFloat(tmpLAT)]};
      
    
        //MAPLINK
        var tmpLATLON = tmpLAT + "," + tmpLON;
        var tmpLINK = this.mapLINK + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.url_pin = {};
        this.new_variable_to_be_inserted.metadata.url_pin.url = tmpLINK;
        this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.link = tmpLINK; 
    
        //Speed from knots to Km/h
        var knot = 1.852;
        tmpSPD = tmpSPD * knot;
        tmpSPD = tmpSPD.toFixed(1);
    
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





    decode_gll(raw_message){
        raw_message = raw_message.replace("*", ",");

        var tmpSPLIT = raw_message.split(",");

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
        new_variable_to_be_inserted.location = {};
        new_variable_to_be_inserted.location.lat = parseFloat(tmpLAT);
        new_variable_to_be_inserted.location.lng = parseFloat(tmpLON);

        //MAPLINK
        var tmpLATLON = tmpSPLIT[3] + "," + tmpSPLIT[4];
        var tmpLINK = mapLINK + tmpLATLON;
        new_variable_to_be_inserted.metadata.url_pin = {};
        new_variable_to_be_inserted.metadata.url_pin.url = tmpLINK;
        new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + tmpLATLON;
        new_variable_to_be_inserted.metadata.link = tmpLINK;

        //MORE METADATA
        this.new_variable_to_be_inserted.metadata.lat = tmpLAT;
        this.new_variable_to_be_inserted.metadata.lon = tmpLON;
    };





    decode_gga(raw_message){
        raw_message = raw_message.replace("*", ",");

        var tmpSPLIT = raw_message.split(",");
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
        new_variable_to_be_inserted.location = {};
        new_variable_to_be_inserted.location.lat = parseFloat(tmpLAT);
        new_variable_to_be_inserted.location.lng = parseFloat(tmpLON);
    
        //MAPLINK
        var tmpLATLON = tmpSPLIT[3] + "," + tmpSPLIT[4];
        var tmpLINK = mapLINK + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.url_pin = {};
        this.new_variable_to_be_inserted.metadata.url_pin.url = tmpLINK;
        this.new_variable_to_be_inserted.metadata.url_pin.alias = "Open map at " + tmpLATLON;
        this.new_variable_to_be_inserted.metadata.link = tmpLINK;
    
        //MORE METADATA
        this.new_variable_to_be_inserted.metadata.lat = tmpLAT;
        this.new_variable_to_be_inserted.metadata.lng = tmpLON;
        this.new_variable_to_be_inserted.metadata.alt = tmpALT;
    };





    decode_zda(raw_message){
        raw_message = raw_message.replace("*", ",");

        var tmpSPLIT = raw_message.split(",");

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
        this.new_variable_to_be_inserted.metadata.zda_time = tmpDATETIME;
    };





    decode_vtg(raw_message){
      raw_message = raw_message.replace("*", ",");

      var tmpSPLIT = raw_message.split(",");
      //if (tmpSPLIT[9] == "N") return; //‘N’ = Data not valid
  
      var tmpSPD = tmpSPLIT[7]; //Km/h
      var tmpCOG = tmpSPLIT[1];
      var tmpFLOAT = 0.0;
      var tmpDIR = "";
  
      tmpFLOAT = parseInt(tmpCOG);
      tmpDIR = this.get_cardinal_direction(tmpFLOAT);
  
      this.new_variable_to_be_inserted.metadata.spd = tmpSPD;
      this.new_variable_to_be_inserted.metadata.cog = tmpCOG;
      this.new_variable_to_be_inserted.metadata.direction = tmpDIR;
    };





    decode_psti20(raw_message){
        let dr_cal = raw_message.split(",")[2];
        let gyro_cal = raw_message.split(",")[3];
    
        raw_message = raw_message.replace("*", ",");
    
        var tmpSPLIT = raw_message.split(",");
        raw_message = null;
        if (tmpSPLIT[6] == "A") raw_message = "GPS"; 
        if (tmpSPLIT[6] == "E") raw_message = "GPS-DR";
        if (tmpSPLIT[6] == "N") raw_message = "ERROR";
    
       
        if(raw_message === null || raw_message === "ERROR") { raw_message = this.coordinates_origin }
    
    
        this.new_variable_to_be_inserted.metadata.origin = raw_message;
        this.new_variable_to_be_inserted.metadata.dr_cal = Number(dr_cal);
        this.new_variable_to_be_inserted.metadata.gyro_cal = Number(gyro_cal);
    };





    //CBC = BATTERY
  add_battery_field = (raw_message) => {
    //private method
    raw_message = raw_message.replace(":", ",");
    var tmpSPLIT = raw_message.split(",");
    var tmpFLOAT = tmpSPLIT[3];
    tmpFLOAT = tmpFLOAT / 1000;
    
    this.new_variable_to_be_inserted.metadata.battery = tmpFLOAT;
  };





  add_operator_field = (raw_message) => {
    //COPS =  OPERATORS
    raw_message = raw_message.replace("cops:", "");
    raw_message = raw_message.trim();
    this.new_variable_to_be_inserted.metadata.cops = raw_message;
  };





  add_jamming_state = (raw_message) => {
    //private method
    raw_message = raw_message.replace("SJDR: ", "");
    raw_message = raw_message.trim();
    this.new_variable_to_be_inserted.metadata.jamm = raw_message;
  };

 



  get_cardinal_direction = (tmpFLOAT) => {
    //private method
    var tmpDIR = "NULL";

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


module.exports = gps_sentences;