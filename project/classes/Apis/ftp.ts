

class ftp_methods {
  xml_file_name: string;
  ftp_connection: any;


   constructor(xml_file_name: string, ftp_connection: any){
     this.xml_file_name = xml_file_name;
     this.ftp_connection = ftp_connection;
   }




    async get_file_content(): Promise<any>{//public method
        let file_content;
        
        return new Promise((resolve,reject) => {
             this.ftp_connection.get(`./${this.xml_file_name}`, async function(err: any, stream: any) {
                  
                if(err){ throw err }
                
                else{
                    stream.once('close', function() {});

                    await stream.on('data', (chunk: any) => {//themethod stream.on is responsible per catch the file content and store the content in the variable;
                        file_content = "";
                        file_content = file_content + chunk;

                        if(!file_content.includes("</payload>")){ resolve(undefined) }
                        
                        else{
                            let stu_messages =  file_content !== undefined 
                                                                ? file_content.split("</stuMessage>")//Each tag </stuMessage> represents one message sent by device
                                                                : undefined

                            stu_messages !== undefined && stu_messages.pop();//I'm removing the las position because the last position doesn't have anything.
                            resolve(stu_messages); 
                        }
                    });     
                }
                
            });
         })//end of promise     
      
    }





    async delete_file_from_ftp(): Promise<void>{//public method
      
        return new Promise((resolve,reject) => {

           this.ftp_connection.delete(`./${this.xml_file_name}`,function(err: any){
             if(err){
               return err;
             }else{
               resolve(console.log("deleted"));
             }
         })

       }) 
   
    }





    //
}



module.exports = ftp_methods;