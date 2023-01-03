 class ftp_and_tago_function{
    xml_file_name;
    ftp_connection;
    file_content;

    constructor(xml_file_name, ftp_connection){
      this.xml_file_name = xml_file_name;
      this.ftp_connection = ftp_connection;
    }


    async get_file_content(){//public method
        let file_content;
        
        await this.ftp_connection.get(`./${this.xml_file_name}`, async function(err, stream) {
            
              if(err){ 
                  throw err
              }else{
                  stream.once('close', function() {});

                  await stream.on('data', (chunk) => {
                    file_content = "";
                    file_content = file_content + chunk;

                    if(!file_content.includes("</payload>")){/*  console.log(this.delete_file_from_ftp()) */ };
                });     

              }
              
        });


        return new Promise((resolve, reject) => {
          setTimeout(() => {
              this.file_content = file_content;console.log(file_content)
              let stu_messages = file_content.split("</stuMessage>");
              stu_messages.pop();//I'm removing the las position because the last position doesn't have anything.
              return resolve(stu_messages);
          }, 4000)//diminuir o tempo do setTimeout(), mandar uma lista de acordo com a quantidade de stu messages que existem dentro do device
        })
        
      
    }






    async delete_file_from_ftp(){//public method
   
        let resp = await this.ftp_connection.put(this.file_content,`./Battery Bank Test/${this.xml_file_name}`, function(err){
         if(err)
           return err;   
         })

         this.ftp_connection.delete(`./${this.xml_file_name}`,function(err){
          if(err){
            return err;
          }else{
            console.log("deleted");
          }

      })

         
         return new Promise((resolve, reject) => {
           setTimeout(() => {
               return resolve(resp);
           }, 4000)//diminuir o tempo do setTimeout(), mandar uma lista de acordo com a quantidade de stu messages que existem dentro do device
         })
         
 
        
     }






     async insert_on_tago(decoded_code, account_tago, Device, device_id){//public method
        let device_token = (await account_tago.devices.paramList(device_id)).find(parameter => parameter.key === "device_token").value;
        this.add_google_link(decoded_code);
        const tago_device = new Device({ token: device_token });
        return  console.log(await tago_device.sendData(decoded_code));
      }
 


      add_google_link(decoded_code){//private method
       console.log(decoded_code.metadata.link = `https://www.google.com/maps/search/?api=1&query=${decoded_code.location[0]},${decoded_code.location[1]}`);
      }

}


module.exports = ftp_and_tago_function