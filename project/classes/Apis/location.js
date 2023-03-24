const axios = require('axios');


class location_apis {


     prepare_mac_parameterers_for_requisition = (wifi_fields, scope) => {//private method
            let wifi_parameters_list = new Array();
    
            if(wifi_fields === undefined){
                return; 
            }else{
                wifi_fields.forEach(key => {
                if(!scope[0].metadata[key]){//if there isn´t nothing field with the specific wifi name, will retun the function.
                  return
                }
            
                let wifi_fields_array = scope[0].metadata[key].split(",");
                wifi_parameters_list.push({
                macAddress: wifi_fields_array[0],
                signalStrength: wifi_fields_array[1],
                signalToNoiseRatio: 0,
                })
            
              });
            } 
            
        return wifi_parameters_list;
     }
    




      parseToObjectLBS = (keyTag,scope,dataType) => {
        if(keyTag === undefined){ return; }

        let lbsList = new Array();   
          
              keyTag.forEach(key => {
      
                  if(!scope[0].metadata[key]){ return; }// if there isn´t nothing field with the specific lbs, will retun the function.
              
                  let arrayFieldsLbs = (scope[0].metadata[key]).split(',');
                  if (arrayFieldsLbs.length < 3) { return; }
                  if (arrayFieldsLbs[4] === "FFFF" || arrayFieldsLbs[7] === "0000") { return; }
      
                  if (arrayFieldsLbs.length > 10) {

                    if(dataType === "/lte"){
                        lbsList.push({
                            cell: arrayFieldsLbs[0],
                            earfcn: arrayFieldsLbs[1],
                            pci: arrayFieldsLbs[2],
                            rsrp: arrayFieldsLbs[3],
                            rssi: arrayFieldsLbs[4],
                            rsrq: arrayFieldsLbs[5],
                            sinr: arrayFieldsLbs[6],
                            lac: arrayFieldsLbs[7],
                            cellid:arrayFieldsLbs[8],
                            mcc:arrayFieldsLbs[9],
                            mnc:arrayFieldsLbs[10],
                            txPower:arrayFieldsLbs[11]
                        });
                        }else{
                            lbsList.push({
                                cell: arrayFieldsLbs[0],
                                bcch: arrayFieldsLbs[1],
                                rxl: arrayFieldsLbs[2],
                                rxq: arrayFieldsLbs[3],
                                mcc: arrayFieldsLbs[4],
                                mnc: arrayFieldsLbs[5],
                                bsic: arrayFieldsLbs[6],
                                cellid: arrayFieldsLbs[7],
                                rla: arrayFieldsLbs[8],
                                txp: arrayFieldsLbs[9],
                                lac: arrayFieldsLbs[10],
                                ta: arrayFieldsLbs[11],
                            });
                        }

                  }else {
                    if(dataType === "/lte"){
                        lbsList.push({
                      cell: arrayFieldsLbs[0],
                      earfcn: arrayFieldsLbs[1],
                      pci: arrayFieldsLbs[2],
                      rsrp: arrayFieldsLbs[3],
                      rssi: arrayFieldsLbs[4],
                      rsrq: arrayFieldsLbs[5],
                      sinr: arrayFieldsLbs[6]
                      });  
                    
                    }else{
                        lbsList.push({
                            cell: arrayFieldsLbs[0],
                            bcch: arrayFieldsLbs[1],
                            rxl: arrayFieldsLbs[2],
                            bsic: arrayFieldsLbs[3],
                            cellid: arrayFieldsLbs[4],
                            mcc: arrayFieldsLbs[5],
                            mnc: arrayFieldsLbs[6],
                            lac: arrayFieldsLbs[7],
                            });
                    }


                  }
        
              });
      

            
            return lbsList;
      
      }//end of function parseToObjectLBS
     
     
     
     
     
     get_address_through_coordinates = async(latitude, longitude) =>{//public method
        const request = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
        
        if(request.data.address !== undefined){
          let address = request.data.address;

          return address.quarter === undefined
                              ? `${address.road} - ${address.suburb} - ${address.state} - ${address.city} - ${address.postcode}`
                              : `${address.road} - ${address.quarter} - ${address.state} - ${address.city} - ${address.postcode}`; 
        }else{
         return {address: "no data available"};
        }
        
      }





       get_coordinates_through_mac_datas = async(wifi_fields, scope) =>{
          
         let list = this.prepare_mac_parameterers_for_requisition(wifi_fields, scope);
        
            try{
                    /* if the mode that i sent to a function is the same the wifi, i want that the function made a macAddress requisition */
                    const result = await axios({
                        method: "POST",
                        url: "https://www.googleapis.com/geolocation/v1/geolocate",
                        params: {
                          key: "AIzaSyDq2lk5DBMUg2ymbDimMunBbvQwk-4MeLg",
                        },
                        data: {
                          homeMobileCountryCode: 0,
                          homeMobileNetworkCode: 0,
                          radioType: "gsm",
                          carrier: "Vodafone",
                          considerIp: false,
                          wifiAccessPoints: list
                        },
                    })
        

                    if (!result) { return {lat:0, lng:0} };
                    return result.data.location;

            }catch(e){ return {lat:0, lng:0} }
   
     } 





     get_coordinates_through_lbs_datas = async(list) =>{
        
         try{
             /* if the mode isn´t the same the wifi, the mode will be LBS */
             /* I create a array with several objects, this array will be used how parameter in the google API  */
                 let cellTowers = list.map((lbs) => {
                    return {
                      cellId: mode.endsWith("/lte") === true ?lbs.cellid :parseInt(lbs.cellid,16),
                      locationAreaCode :mode.endsWith("/lte") === true ?parseInt(lbs.lac,10) :parseInt(lbs.lac,16),
                      mobileCountryCode: lbs.mcc,
                      mobileNetworkCode: lbs.mnc,
                      };
                    });
          
      
            
                 const lbs0 = list.find((x) => x.cell === "LBS0");
                 if(!lbs0){ return {lat:0, lng:0} };
          
      
                    
            /*  Google api will return geography coordinates accordingly with the lbs Datas returned of const cellTowers(objects array) */
                const result = await axios({
                    method: "POST",
                    url: "https://www.googleapis.com/geolocation/v1/geolocate",
                    params: {
                      key: "AIzaSyDq2lk5DBMUg2ymbDimMunBbvQwk-4MeLg",
                    },
                    data: {
                       homeMobileCountryCode: lbs0.mcc,
                       homeMobileNetworkCode: lbs0.mnc,
                       radioType: mode.endsWith("/lte") === true ?"LTE" :"gsm",//define o tipo de dados que a minha api vai receber GSM | LTE
                       carrier: "Vodafone",
                       considerIp: false,
                       cellTowers:mode.endsWith("/lte") === true ? [cellTowers[0]] :cellTowers
                      }
                    });
                            
                          
                    if(!result) { return {lat:0, lng:0} };
                    return result.data.location;
                    
            }catch(e){ return {lat:0, lng:0}; }
           
        
   
     }


}


module.exports = location_apis;