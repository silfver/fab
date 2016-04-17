require('dotenv').load();
var gcm = require('node-gcm');
var kue = require('kue')
 , queue = kue.createQueue();

queue.process('email', function(job, done){
  email(job.data.to, done);
});

function send_gcm(gcm_notification, done) {
  if(!isValidEmail(address)) {
    //done('invalid to address') is possible but discouraged
    return done(new Error('invalid to address'));
  }
  // email send stuff...
  done();
}

var message = new gcm.Message();
var sender = new gcm.Sender(process.env.GCM_API_KEY);
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
}
var redis_scanner = require('redis-scanner');
redis_scanner.bindScanners(client);


client.hscan('gcm_notifications', function(entry){
	var registrationIds = [];
	// Value the payload data to send...
	message.addData('message',"you got a fab from XXX");
	message.addData('title','OMG new fab!' );
	message.addData('msgcnt','3'); // Shows up in the notification in the status bar
	message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
	message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.
	 
	// At least one reg id required
	registrationIds.push();
	 
	/**
	 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
	 */
	/*sender.send(message, registrationIds, 4, function (result) {
	    console.log(result);
	})*/;
}, function(err){
 	console.log(err);
});


