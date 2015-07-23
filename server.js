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
var imageController = require('./controllers/image');

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
    .get(authController.isAuthenticated, userController.getUsers);
router.route('/user/me')
    .get(authController.isAuthenticated, userController.getMe);
router.route('/user/:id')
    .get(authController.isAuthenticated, userController.getById);    
router.route('/user/add_friend')
    .put(authController.isAuthenticated, userController.addFriendToUser);
router.route('/user/remove/:id')
    .delete(authController.isAuthenticated, userController.deleteUser);
router.route('/user/remove_friend/:id')
    .delete(authController.isAuthenticated, userController.deleteFriend);
router.route('/users/search/:username')
    .get(authController.isAuthenticated, userController.search);
router.route('/image/register')
    .post(authController.isAuthenticated, imageController.register);
router.route('/image/:id')
    .get(authController.isAuthenticated, imageController.get);
router.route('/image/react')
    .post(authController.isAuthenticated, imageController.react);
router.route('/images')
    .get(authController.isAuthenticated, imageController.getAll);
router.route('/reactions')
    .get(authController.isAuthenticated, imageController.getAvailableReactions);

app.use('/api', router);

http.listen(process.env.PORT || 3000, function(){
    console.log('listening on process port');
});
