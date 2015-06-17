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
	});
}
// Stub for user authentication --> needs more thought
app.get('/api/users/me', function(req, res) {
	var user = users[Math.floor(Math.random()*users.length)];
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ username: user}));
});

var nsp = io.of('/sarina');
nsp.on('connection', function(socket){
	socket.on('image reaction', function(msg){
	nsp.emit('image reaction', msg.user + " sa "+msg.reaction);
	});
	socket.on('request image', function(msg) {
	nsp.emit('new image', { image: "http://res.cloudinary.com/fab/image/upload/c_fill,h_0.55,w_1.0/v1434446554/internal_images/tumblr_nm4y21eqTj1u53c30o1_1280.jpg"});
	});
});
http.listen(process.env.PORT || 3000, function(){
	console.log('listening on process port');
});
