Dev: Kaique Yudji
Date: 12/12/2022
Purpose of the code: this code it's responsible per get a FTP server and decode its messages. In this case, the code will analyse 2 differents types code. 
1:SOC datas(messages sent per device smartOneC, a new device that we are working).
2:STU datas(mesages sent per device when they can't catch gps Signal). 
Moreover, this code will create a GPS link with the translated coordinates, format the translated datas in a json object, insert this object in the bucket of device that sent the message, 
If you don't know all funcionalities of TAGO.IO. Tt's important study some bullet points of company before starts use this code.  




<H1>Data Types:<H1>
-STU MESSAGE: the stu message it's responsible for identifying each message that the device sent. For example: if i have two STU TAGS within of my xml, i will have two differents messages inside a single XML file.




<H1>XML FILE, How it works?<H1>
 the device send datas trough of xml files. Each xml file contains datas that the device catched. Inside of a xml file, we have tags that are called of: StuMessages, you can see some examples in the code below:

<stuMessages>//first stuMessage tag

   <stuMessages>//second StuMessage tag 
        <esn>0-2664299</esn>
        <unixTime>1670349067</unixTime>
        <gps>N</gps>
        <payload length="9" source="pc" encoding="hex">0x2EDE712ADED613006F</payload>
   </stuMessages>

   <stuMessages>//third StuMessage tag 
        <esn>0-2664299</esn>
        <unixTime>1670349067</unixTime>
        <gps>N</gps>
        <payload length="9" source="pc" encoding="hex">0x3TGDE712ADED612406F</payload>
   </stuMessages>

</stuMessages>

inside of second StuMessage tag, we'll have all the datas has sent by device. We can have more than one stuMessages inside of first stuMessage tag(each stuMessage inside of first tag, matches the one different message.)


