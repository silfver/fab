var app = require('express')();
var passport = require('passport');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs'); 
var cloudinary = require('cloudinary');


//probably move to env later
cloudinary.config({ 
  cloud_name: 'fab', 
  api_key: '685122177578734', 
  api_secret: 'ajmGJfwrimKrdiZeTuF29V8QO34' 
});


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});



// Stub for user authentication --> needs more thought
app.get('/api/users/me',
  passport.authenticate('basic', { session: false }),
  function(req, res) {
    res.json({ id: req.user.id, username: req.user.username });
});

var nsp = io.of('/sarina')
nsp.on('connection', function(socket){
  socket.on('image reaction', function(msg){
    nsp.emit('image reaction', msg);
  });
  socket.on('request image', function(msg) {
	nsp.emit('new image', { image: "http://res.cloudinary.com/fab/image/upload/c_fill,h_0.55,w_1.0/v1434446554/internal_images/tumblr_nm4y21eqTj1u53c30o1_1280.jpg"});
  });
});
http.listen(process.env.PORT || 3000, function(){
  console.log('listening on process port');
});
