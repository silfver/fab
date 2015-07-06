require('dotenv').load();
var app = require('express')();
var express = require('express');
var passport = require('passport');
var path = require('path');
var http = require('http').Server(app);
var url = require('url');
var bodyParser = require('body-parser');
var cloudinary = require('cloudinary');
var done = false;
var mongoose = require('mongoose');
var expressSession = require('express-session');
var cloudinary_vars = url.parse(process.env.CLOUDINARY_URL);
var User = require('./models/user');
var userController = require('./controllers/user');
var authController = require('./controllers/auth');

mongoose.connect(process.env.MONGOLAB_URI);

var router = express.Router();

app.use(expressSession({secret: 'process.env.EXPRESSECRETKEY'}));
app.use(passport.initialize());

app.use(bodyParser.urlencoded({
  extended: true
}));


cloudinary.config({ 
    cloud_name: cloudinary_vars.hostname, 
    api_key: cloudinary_vars.auth.split(':')[0], 
    api_secret: cloudinary_vars.auth.split(':')[1]
});

router.route('/user/new')
    .post(userController.createNewUser);

router.route('/users')
    .get(userController.getUsers);

router.route('/user/add_friend')
    .put(userController.addFriendToUser);

// REST API
// ----------------------

/*app.get('/api/friends', function(req, res){
    var username = req.query.user;
    var my_friends = [];
    User.findOne({ 'username' :  username }, 
        function(err, user) {
            // In case of any error, return using the done method
            if (err)
                return done(err);
            // Username does not exist, log the error and redirect back            
            // User and password both match, return user from done method
            // which will be treated like success
            res.send(JSON.stringify(user));
        }
    );
});

app.get('user', function(req, res){
    var username = req.query.username;
    User.findOne({ 'username' :  username }, 
        function(err, user) {
            // In case of any error, return using the done method
            if (err)
                return done(err);
            // User and password both match, return user from done method
            // which will be treated like success
            res.send(JSON.stringify(user));
        }
    );
});


app.post('/api/image/new', function(req,res){
    console.log(req);
    res.send('picture uploaded');
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
    
});*/

app.use('/api', router);

http.listen(process.env.PORT || 3000, function(){
    console.log('listening on process port');
});
