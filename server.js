require('dotenv').load();
var app = require('express')();
var express = require('express');
var passport = require('passport');
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs'); 
var url = require('url');
var multer = require('multer');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cloudinary = require('cloudinary');
var users = ['sarina', 'johan', 'anders', 'jc', 'alex'];
var done = false;
var mongoose = require('mongoose');
var expressSession = require('express-session');
var cloudinary_vars = url.parse(process.env.CLOUDINARY_URL);

mongoose.connect(process.env.MONGOLAB_URI);

app.use(expressSession({secret: 'process.env.EXPRESSECRETKEY'}));
app.use(passport.initialize());
app.use(passport.session());


var flash = require('connect-flash');
app.use(flash());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



cloudinary.config({ 
    cloud_name: cloudinary_vars.hostname, 
    api_key: cloudinary_vars.auth.split(':')[0], 
    api_secret: cloudinary_vars.auth.split(':')[1]
});

// Initialize Passport for user handling
var initPassport = require('./passport/init');
initPassport(passport);

var routes = require('./routes/index')(passport);
app.use('/', routes);


var nsp = io.of('/fab');
var filename = false;


// REST API
// ----------------------
/*app.get('/', function(req, res){
    res.sendFile(__dirname + '/someone_elses_image.html');
});*/
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
        nsp.to(msg.image_sender).emit('image reaction', msg.user + " sa "+msg.reaction);
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
    console.log("sending to "+user)
    nsp.emit('new image', {image: image.secure_url, user: user});
}

http.listen(process.env.PORT || 3000, function(){
    console.log('listening on process port');
});
