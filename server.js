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
  	console.log("test av image request!");
    //fs.readFile(__dirname + '/images/image.jpg', function(err, buf){
	//    socket.emit('new image', { image: true, buffer: buf.toString('base64')});
  	//});
  });
});
http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});
