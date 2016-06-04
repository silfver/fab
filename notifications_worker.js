require('dotenv').load();
var gcm = require('node-gcm');

var message = new gcm.Message();
var sender = new gcm.Sender(process.env.GCM_API_KEY);

var registrationIds = [];
// Value the payload data to send...
message.addData('message',"hello, ska bara testa en grej");
message.addData('title','OMG push notifications!' );
message.addData('msgcnt','3'); // Shows up in the notification in the status bar
//message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.
 
// At least one reg id required
registrationIds.push("lWnKdKLDVu4:APA91bEJb4SOobRoC9joasc4GFWBjXEpmRa7Knv1OOsLfm865EmV2HrFyd5oEXoI2Fi0o_Woxrha81gNgjeQscruSRrmewHdsBx5QEK_3gCFtcIJm9Ll-V8htSvyCIr1RrhBOYpUbPXR");

/**
 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
 */
sender.send(message, registrationIds, 4, function (err, result) {
    console.log(result);
});
