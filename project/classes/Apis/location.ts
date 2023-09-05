const axios = require('axios');


export class location_apis {


     prepare_mac_parameterers_for_requisition = (wifi_fields: any, esn: any) => {//private method
            let wifi_parameters_list = new Array();
    
            if(wifi_fields === undefined){
                return; 
            }else{
                wifi_fields.forEach((key: any) => {
                if(!esn.metadata[key]){//if there isn´t nothing field with the specific wifi name, will retun the function.
                  return
                }
            
                let wifi_fields_array = esn.metadata[key].split(",");
                wifi_parameters_list.push({
                  macAddress: wifi_fields_array[0],
                  signalStrength: wifi_fields_array[1],
                  signalToNoiseRatio: 0,
                })
            
              });
            } 
            
        return wifi_parameters_list;
     }
    




      prepare_lbs_parameters_for_requesition = (keyTag: any,esn: any,dataType: any) => {
        if(keyTag === undefined){ return; }

        let lbsList = new Array();   
          
              keyTag.forEach((key: any) => {
      
                  if(!esn.metadata[key]){ return; }// if there isn´t nothing field with the specific lbs, will retun the function.
              
                  let arrayFieldsLbs = (esn.metadata[key]).split(',');
                  if (arrayFieldsLbs.length < 3) { return; }
                  if (arrayFieldsLbs[4] === "FFFF" || arrayFieldsLbs[7] === "0000") { return; };
      
                  if (arrayFieldsLbs.length > 10) {

                    if(dataType === "lte"){
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
                    if(dataType === "lte"){
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
     
     
     
     
     
     get_address_through_coordinates = async(latitude: any, longitude: any) =>{//public method
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





       get_coordinates_through_mac_datas = async(wifi_fields: any, esn: any) =>{
          
         let list = this.prepare_mac_parameterers_for_requisition(wifi_fields, esn);
        
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





     get_coordinates_through_lbs_datas = async(lbs_fields: any, esn: any, data_type: any) =>{
         try{
                 let list: any = this.prepare_lbs_parameters_for_requesition(lbs_fields, esn, data_type);
             
                 let cellTowers = list.map((lbs: any) => {/* I create a array with several objects, this array will be used how parameter in the google API  */
                      return {
                         cellId: data_type === "lte" ?  parseInt(lbs.cellid) :parseInt(lbs.cellid),
                         locationAreaCode :data_type === "lte" ?parseInt(lbs.lac) :parseInt(lbs.lac),
                         mobileCountryCode: parseInt(lbs.mcc),
                         mobileNetworkCode: parseInt(lbs.mnc),
                        };
                  });
          
                 
                  
                 const lbs0 = list.find((x: any) => x.cell === "LBS0");
                 if(!lbs0){ return {lat:0, lng:0} };
          
            
                    
            /*  Google api will return geography coordinates accordingly with the lbs Datas returned of const cellTowers(objects array) */
                const result = await axios({
                    method: "POST",
                    url: "https://www.googleapis.com/geolocation/v1/geolocate",
                    params: {
                      key: "AIzaSyDq2lk5DBMUg2ymbDimMunBbvQwk-4MeLg",
                    },
                    data: {
                       homeMobileCountryCode: parseInt(lbs0.mcc),
                       homeMobileNetworkCode: parseInt(lbs0.mnc),
                       radioType: data_type === "lte" ?"LTE" :"gsm",//define o tipo de dados que a minha api vai receber GSM | LTE
                       carrier: "Vodafone",
                       considerIp: false,
                       cellTowers: data_type === "lte" ? [cellTowers[0]] :cellTowers
                      }
                    }).catch((err: any) => console.log())
                            
                          
                    if(!result) { return {lat:0, lng:0} };
                    return result.data.location;
                    
            }catch(e){ return {lat:0, lng:0}; }
           
        
   
     }


}


