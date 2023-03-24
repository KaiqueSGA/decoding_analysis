


class tago_functions {
    account;

    constructor(account){
      this.account = account;
    }


    async insert_on_tago(decoded_code, Device, device_id, time){//public method

        let device_token = (await this.account.devices.paramList(device_id)).find(parameter => parameter.key === "device_token").value;
        const tago_device = new Device({ token: device_token });console.log(decoded_code)
       
        return console.log(await tago_device.sendData(decoded_code).catch(err => console.log(err)));
    }

}


module.exports = tago_functions;