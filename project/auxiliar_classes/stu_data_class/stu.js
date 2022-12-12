//falta terminar o algorítimo
class stu_message{
    contructor(hexadecimal_code){
        this.hexa_code = hexadecimal_code;
     }


     decode(hexa_code){

    }

    delete_file_from_ftp(xml_content, xml_name){
        
    }

     insert_on_tago(esn){
        try{
            let filter = {
              tags:[ { key:"ESN", value:payload.value } ]
           }
  
            //this code is searching the device trough of ESN that is in the xml file.
             const searching_device_on_tago = await methods.account.devices.list( {page:1, filter} );
  
             if(searching_device_on_tago === undefined || searching_device_on_tago === null || searching_device_on_tago.length === 0){
               return `Dispositivo que corresponde a ESN:${payload.value} não existe.`
             } 

             //this block code is catching the device id.
             let id_device = searching_device_on_tago[0].id;
             let devices_tag_list = await methods.account.devices.paramList(id_device);
             let SearchDevicetoken = devices_tag_list.find(item => item.key === 'device_token');
             let device_token = SearchDevicetoken.value;
             
       
             const myDevice = new Device({ token: device_token });
     
                const result = await myDevice.sendData({
                 variable:payload.variable,
                 value:payload.value,
                   location:{
                     lat:payload.location.lat,
                     lng:payload.location.lng
                 },  
                 metadata:{
                  ORIGIN:payload.metadata.origin,
                  media:payload.metadata.media,
                  JAMM:payload.metadata.jamm,
                  SPD:payload.metadata.spd,
                  MODE3:payload.metadata.mode,
                  vBAT:payload.metadata.batery,
                  direction:payload.metadata.direction,
                  timeStamp:payload.metadata.timeStamp,
                  link:payload.metadata.link
                 } 
             });     
  
             
             
             if(result.indexOf('Added') !== -1){ console.log('Data inserted!') }
             
             else{ console.log("error data inserting") }

      }catch(err){

      }
  }

}