require('dotenv').load();
var app = require('express')();
var express = require('express');
var passport = require('passport');
var path = require('path');
var http = require('http').Server(app);
var url = require('url');
var bodyParser = require('body-parser');
var cloudinary = require('cloudinary');
var cors = require('cors');
var done = false;
var mongoose = require('mongoose');
var expressSession = require('express-session');
var cloudinary_vars = url.parse(process.env.CLOUDINARY_URL);
var User = require('./models/user');
var userController = require('./controllers/user');
var authController = require('./controllers/auth');
var imageController = require('./controllers/image');
var planetController = require('./controllers/planet');

mongoose.connect(process.env.MONGOLAB_URI);
var router = express.Router();

app.use(expressSession({secret: 'process.env.EXPRESSECRETKEY'}));
app.use(passport.initialize());
app.use(cors());

app.use(bodyParser.urlencoded({
  extended: true
}));
cloudinary.config({ 
    cloud_name: cloudinary_vars.hostname, 
    api_key: cloudinary_vars.auth.split(':')[0], 
    api_secret: cloudinary_vars.auth.split(':')[1]
});
// cloudinary.api.delete_all_resources(function(result){});
// generic error handling
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

router.route('/user/new')
    .post(userController.createNewUser);
router.route('/user/checkname/:username')
    .get(userController.checkUsernameAvailable);
router.route('/users')
    .get(authController.isAuthenticated, userController.getUsers);
router.route('/image/reactions_list')
    .get(authController.isAuthenticated, imageController.getReactionList);
router.route('/image/unseen_reactions_number')
    .get(authController.isAuthenticated, imageController.getUnseenReactionsNumber);
router.route('/user/following/')
    .get(authController.isAuthenticated, userController.getFollowing);  
router.route('/user/followers/')
    .get(authController.isAuthenticated, userController.getFollowers);  
router.route('/user/me')
    .get(authController.isAuthenticated, userController.getMe);
router.route('/user/unseen_images')
    .get(authController.isAuthenticated, userController.getUnseenImages);
router.route('/user/forgot_password')
    .post(userController.forgotPassword);
router.route('/user/reset/:token')
    .post(userController.resetPassword); 
router.route('/user/start_following')
    .put(authController.isAuthenticated, userController.startFollowing);
router.route('/user/planets')
    .get(authController.isAuthenticated, userController.getPlanets);
router.route('/user/:id')
    .get(authController.isAuthenticated, userController.getById);  
router.route('/user/profile_image/:id')
    .put(authController.isAuthenticated, userController.updateProfileImage);      
router.route('/user/background_image/:id')
    .put(authController.isAuthenticated, userController.updateBackgroundImage);      
router.route('/user/image/latest/')
    .get(authController.isAuthenticated, userController.getLatestImage);     
router.route('/user/image/unseen/')
    .get(authController.isAuthenticated, userController.getNextUnseenImage);      
router.route('/user/followers/new/')
    .get(authController.isAuthenticated, userController.getNewFollowers);          
router.route('/user/remove/')
    .delete(authController.isAuthenticated, userController.deleteUser);
router.route('/user/remove_follower/:id')
    .delete(authController.isAuthenticated, userController.deleteFollower);
router.route('/user/stop_following/:id')
    .delete(authController.isAuthenticated, userController.stopFollowing);
router.route('/users/search/:username')
    .get(authController.isAuthenticated, userController.search);
router.route('/image/register')
    .post(authController.isAuthenticated, imageController.register);
router.route('/image/:id')
    .get(authController.isAuthenticated, imageController.get);
router.route('/image/get_hash')
    .post(authController.isAuthenticated, imageController.getHash);
router.route('/image/react')
    .post(authController.isAuthenticated, imageController.react);
router.route('/image/reactions/:id')
    .get(authController.isAuthenticated, imageController.getReactions);
router.route('/image/:id')
    .delete(authController.isAuthenticated, imageController.delete);
router.route('/images')
    .get(authController.isAuthenticated, imageController.getAll);
router.route('/reactions')
    .get(imageController.getAvailableReactions);
router.route('/planet/latest/:id')
    .get(authController.isAuthenticated, planetController.getLatestById);
router.route('/planet/new')
    .post(authController.isAuthenticated, planetController.createNewPlanet);
router.route('/planet/start_following')
    .put(authController.isAuthenticated, planetController.startFollowing);
router.route('/planet/stop_following/:id')
    .delete(authController.isAuthenticated, planetController.stopFollowing);
router.route('/planet/:id')
    .get(authController.isAuthenticated, planetController.getById);
router.route('/planets/')
    .get(authController.isAuthenticated, planetController.getPlanets);
router.route('/invite/')
    .post(authController.isAuthenticated, userController.invite);
router.route('/user/bio')
    .post(authController.isAuthenticated, userController.updateBio);

app.use('/api', router);

http.listen(process.env.PORT || 3000, function(){
    console.log('listening on process port');
});
