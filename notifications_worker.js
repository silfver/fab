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
registrationIds.push("mJREIlCmVNo:APA91bGimIPgKq7VRob0OyIRNRzp_C1gzsmMW3FMx6K-batXS9y2u_CMY2kDj3bto9KCkLwRzgNr7mDk-fKbvCCgD8aG2n_-ylqkAdaWMoYzx-H7meRAo5YX_v7ria8e0TMHTVVxy614");

/**
 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
 */
sender.send(message, registrationIds, 4, function (err, result) {
    console.log(result);
});
