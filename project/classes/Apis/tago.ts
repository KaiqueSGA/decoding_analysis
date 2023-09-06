


export class tago_functions {
    account;

    constructor(account: any){
      this.account = account;
    }


    async insert_on_tago(decoded_code: any, Device: any, device_id: any){//public method

        let device_token: string = (await this.account.devices.paramList(device_id)).find((parameter: any) => parameter.key === "device_token").value;
        const tago_device = new Device({ token: device_token });

        return console.log(await tago_device.sendData(decoded_code).catch((err: any) => console.log(err)));
    }

};


