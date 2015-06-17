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

var user = false;
var nsp = io.of('/fab');

app.get('/', function(req, res){
	res.sendFile(__dirname + '/someone_elses_image.html');
});
app.get('/myimage', function(req, res){
	res.sendFile(__dirname + '/my_image.html');
});

app.use(multer({ dest: './uploads/',
	rename: function (fieldname, filename) {
		return filename+Date.now();
	},
	onFileUploadStart: function (file) {
		console.log(file.originalname + ' is starting ...')
	},
	onFileUploadComplete: function (file) {
		sendToCloudinary(file);
		done=true;
	}
}));

app.post('/api/photo', function(req,res){
	if(done==true){
    	res.end("File uploaded.");
  	}
});

function sendToCloudinary(file) {
	cloudinary.uploader.upload('./uploads/'+file.name, function(result) { 
		console.log(result);
		sendImageToMyFriends(result);
	});
}
// Stub for user authentication --> needs more thought
app.get('/api/users/me', function(req, res) {
	var user = createUser();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ username: user}));
	
});

nsp.on('connection', function(socket){
		socket.on('image reaction', function(msg){
			nsp.emit('image reaction', msg.user + " sa "+msg.reaction);
		});
});	
function createUser() {
	user = users[Math.floor(Math.random()*users.length)];
	return user;
}

function sendImageToMyFriends(image) {
	nsp.emit('new image', {image: image.secure_url, user: user});
}

http.listen(process.env.PORT || 3000, function(){
	console.log('listening on process port');
});
