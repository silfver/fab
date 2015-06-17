require('dotenv').load();
var app = require('express')();
var passport = require('passport');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs'); 
var url = require('url');
var multer = require('multer');
var cloudinary = require('cloudinary');
var users = ['sarina', 'johan', 'anders', 'jc', 'alex'];
var done = false;

var cloudinary_vars = url.parse(process.env.CLOUDINARY_URL);

cloudinary.config({ 
	cloud_name: cloudinary_vars.hostname, 
	api_key: cloudinary_vars.auth.split(':')[0], 
	api_secret: cloudinary_vars.auth.split(':')[1]
});

var nsp = io.of('/fab');
var filename = false;

// REST API
// ----------------------
app.get('/', function(req, res){
	res.sendFile(__dirname + '/someone_elses_image.html');
});
app.get('/myimage', function(req, res){
	res.sendFile(__dirname + '/my_image.html');
});
app.get('/api/friends', function(req, res){
	var username = req.query.user;
	var my_friends = [];
	if (username == 'sarina') {
		my_friends = ['johan', 'anders'];
	}
	if (username == 'jc') {
		my_friends = ['alex', 'anders'];
	}
	if (username == 'johan') {
		my_friends = ['sarina', 'alex', 'anders'];
	}
	res.send(JSON.stringify(my_friends));
});

app.use(multer({ dest: './uploads/',
	rename: function (fieldname, filename) {
		return filename+Date.now();
	},
	onFileUploadStart: function (file) {
	},
	onFileUploadComplete: function (file) {
		filename = file.name;
		done=true;
	}
}));

app.post('/api/photo', function(req,res){
	if(done==true){
		var user = req.body.user;
		console.log(filename);

		sendToCloudinary(filename, user);

    	res.send('all done');
  	}
});

app.get('/api/users/me', function(req, res) {
	user = createUser();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ username: user}));
	
});

// Socket.io stuff
// ----------------------
nsp.on('connection', function(socket){
	socket.on('image reaction', function(msg){
		nsp.emit('image reaction', msg.user + " sa "+msg.reaction);
	});
	socket.on('subscribe', function(room) { 
    	console.log('joining room', room);
    	socket.join(room); 
    });
	socket.on('uploaded image', function(user) { 
    	console.log(user);
    });
});	
// helper functions 
// ----------------------
function sendToCloudinary(file, user) {
	cloudinary.uploader.upload('./uploads/'+file, function(result) { 
		sendImageToMyFriends(result, user);
	});
}

function createUser() {
	user = users[Math.floor(Math.random()*users.length)];
	return user;
}

function sendImageToMyFriends(image, user) {
	nsp.emit('new image', {image: image.secure_url, user: user});
}

http.listen(process.env.PORT || 3000, function(){
	console.log('listening on process port');
});
