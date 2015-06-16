var app = require('express')();
var passport = require('passport');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Stub for user authentication --> needs more thought
app.get('/api/users/me',
  passport.authenticate('basic', { session: false }),
  function(req, res) {
    res.json({ id: req.user.id, username: req.user.username });
});

io.on('connection', function(socket){
  socket.on('image reaction', function(msg){
    io.emit('image reaction', msg);
  });
});
http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});
