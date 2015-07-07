// Load required packages
var User = require('../models/user');

// Create endpoint /api/users for POST
exports.createNewUser = function(req, res) {
  console.log(req.body);
  var user = new User({
    username: req.body.username,
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    postal_no: req.body.postal_no,
    email: req.body.email
  });
  user.save(function(err) {
    if (err)
      res.send(err);
    res.json({ message: 'New user added' });
  });
};
exports.getMe = function(req, res) {
  var userId = req.user._id;
  User.findOne({_id: userId}, function(err, user) {
    if (err)
      res.send(err);
    res.json(user);
  })
};
exports.search = function(req, res) {
  var partial_username = req.params.username;
  var query = {username: new RegExp('^'+partial_username)};
  User.find(query, function(err, user) {
    if (err) 
      res.send(err);
    res.json(user);
  });
}

// TODO fix ugly error handling
exports.addFriendToUser = function(req, res) {
  var user_id = req.user._id;
  User.findOne({username: req.query.friend}, function(err, friend){
    if (err)
      res.send(err);
    User.findByIdAndUpdate(
      user_id,
      {$push: {friends: friend._id}},
      {safe: true, upsert: true},
      function(err, model) {
        if (err) 
          res.send(err);
        res.json({message: 'Added friends'});
      }
    );
  });
};

// Create endpoint /api/users for GET
exports.getUsers = function(req, res) {
  User.find(function(err, users) {
    if (err)
      res.send(err);
    res.json(users);
  });
};