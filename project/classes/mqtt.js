const ftp_and_tago_function = require("./ftp_and_tago_functions");

class mqtt_message extends ftp_and_tago_function{
  
    constructor(xml_file_name, ftp_connection){
        super(xml_file_name, ftp_connection);
    }



    decode = () => {

    }
}