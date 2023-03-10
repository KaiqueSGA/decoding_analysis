const { default: ConsoleService } = require("@tago-io/sdk/out/modules/Services/Console");
const ftp_and_tago_function = require("./ftp_and_tago_functions");



class stx_message extends ftp_and_tago_function{
  
  constructor(xml_file_name, ftp_connection){
    super(xml_file_name, ftp_connection);
  }

     decode(file_content, esn_value){ 
       let ns;
       let ew;
       let origin;
       let JAMM;
       let mode;
       let direction;
       let batery;
       let lastSPD;

          const hex2bin = (hex) => {
            return ("00000000" + (parseInt(hex, 16)).toString(2)).substr(-8);
          }


          const cactchBin = () =>{
            let binHEX = file_content.substring(12,14);
            let binary = hex2bin(binHEX);
            
           
            for(let i = 0; i <= 5; i++){
          
                  if(i === 0 && binary[i] === "0"){
                    ns = 'Sul';

                  }else if( i === 0 && binary[i] === "1"){
                    ns = 'Norte';

                  }else if(i === 1 && binary[i] === '0'){
                    ew = "weast";

                  }else if(i === 1 && binary[i] === '1'){
                    ew = "east";

                  }else if(i === 2 && binary[i] === '0'){
                    origin ="GPS"

                  }else if(i === 2 && binary[i] === '1'){
                    origin = "GPS-DR"

                  }else if(i === 3 && binary[i] === '0'){
                    JAMM = false;

                  }else if(i === 3 && binary[i] === '1'){
                    JAMM = true

                  }else if(i === 4 && binary[i] === '0'){
                    mode = false;

                  }else if(i === 4 && binary[i] === '1'){
                    mode = true
                  }
          
              }
            //
          
            let dir = binary.substring(5);
            let arr = []
            arr["000"] = "N";
            arr["001"] = "NE";
            arr["010"] = "E";
            arr["011"] = "SE";
            arr["100"] = "S";
            arr["101"] = "SE";
            arr["110"] = "W";
            arr["111"] = "NW" 
             direction = arr[dir]; 
          
            let byte8 = hex2bin(file_content.substring(14,16));
          
            if(byte8.substring(0,1) === '0'){
               batery = "normal";
            }else{
               batery = "low";
            }
          
            let byte9 =  file_content.substring(16,18);
             lastSPD = parseInt(byte9,16);
            
          }


    
          const catchLat = () =>{          
            let latHEX= file_content.substring(0,6); 
            
          
            let lat = parseInt(latHEX,16);//estou convertendo para inteiro um valor hexa, por isso eu coloco o 16 como parâmetro
            lat = String(lat);
          
          
            let tira2casasLat = ns === "Sul" 
                            ?  "-" + lat.substring(0,2)
                            :  lat.substring(0,2);
          
            let restDecimalLat = lat.substring(2);
            
            
            return (tira2casasLat + "." + restDecimalLat);
            
          }
          
          
          
          const catchLng = () =>{
            let lngHEX = file_content.substring(6,12);
            
            let lng = parseInt(lngHEX,16);
            lng = String(lng);
          
            
            let tira2casasLng = ew === "weast" 
                            ?  "-" + lng.substring(0,2)
                            :  lng.substring(0,2);
          
            let restDecimalLng = lng.substring(2);
          
          
            return (tira2casasLng + "." + restDecimalLng);
            
          }


          cactchBin();
          let latitude = Number(catchLat());
          let longitude = Number(catchLng()); 


          return {
            variable: 'ESN',
            value: esn_value,
            location:{ type:"Point", coordinates:[longitude,latitude] },
            metadata: {
              media: 'STX',
              spd: lastSPD,
              mode: mode,
              batery: batery,
              origin: origin,
              direction: direction,
              jamm: JAMM
            }
          }

    }









     async insert_on_tago(decoded_code, account_tago, Device, esn_value){
        try{

            let filter = {
              tags:[ { key:"ESN", value:esn_value } ]
           }
  
            //this code is searching the device trough of ESN that is in the xml file.
             const searching_device_on_tago = await account_tago.devices.list( {page:1, filter} );
  
             if(searching_device_on_tago === undefined || searching_device_on_tago === null || searching_device_on_tago.length === 0){
               return `Dispositivo que corresponde a ESN:${payload.value} não existe.`
             } 

             //this block code is catching the device id.
             let id_device = searching_device_on_tago[0].id;
             let devices_tag_list = await account_tago.devices.paramList(id_device);
             let device_token = devices_tag_list.find(item => item.key === 'device_token').value;
             
       
             const myDevice = new Device({ token: device_token });console.log(decoded_code)
             return console.log(await myDevice.sendData(decoded_code));     
            

      }catch(err){

      }
  }

}



module.exports = stx_message;