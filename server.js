require('dotenv').load();
var app = require('express')();
var express = require('express');
var passport = require('passport');
var path = require('path');
var http = require('http').Server(app);
var url = require('url');
var multer = require('multer');
var bodyParser = require('body-parser');
var cloudinary = require('cloudinary');
var done = false;
var mongoose = require('mongoose');
var expressSession = require('express-session');
var cloudinary_vars = url.parse(process.env.CLOUDINARY_URL);

mongoose.connect(process.env.MONGOLAB_URI);

app.use(expressSession({secret: 'process.env.EXPRESSECRETKEY'}));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
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

var filename = false;


// REST API
// ----------------------

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

app.post('/api/image/new', function(req,res){
    if(done==true){
        var user = req.body.user;
        sendToCloudinary(filename, user);
        res.send('picture uploaded');
    }
});

app.get('/api/users/me', function(req, res) {
    user = {
        username: 'johan',
        firstName: 'johan',
        lastName: 'Lim',
        postal_no: 16847,
        email: 'johan.lim@webassistant.se',
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ username: user}));
    
});

// helper functions 
// ----------------------
function sendToCloudinary(file, user) {
    cloudinary.uploader.upload('./uploads/'+file, function(result) { 
        return (result, user);
    });
}

function createUser() {
    // TODO create a user via passport
    user = users[Math.floor(Math.random()*users.length)];
    return user;
}



http.listen(process.env.PORT || 3000, function(){
    console.log('listening on process port');
});
