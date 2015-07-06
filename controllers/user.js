// Load required packages
var User = require('../models/user');

// Create endpoint /api/users for POST
exports.createNewUser = function(req, res) {
  var user = new User({
    username: req.query.username,
    password: req.query.password,
    firstName: req.query.firstName,
    lastName: req.query.lastName,
    postal_no: req.query.postal_no,
    email: req.query.email,
  });
  user.save(function(err) {
    if (err)
      res.send(err);
    res.json({ message: 'New user added' });
  });
};
exports.getMe = function(req, res) {
  var userId = req.user._id;
  console.log(userId);
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
  var username = req.query.username;
  User.findOne({username: req.query.friend}, function(err, friend){
    if (err)
      res.send(err);
    User.findOne({username: username}, function(err, user) {
      if (err)
        res.send(err);
      User.findByIdAndUpdate(
        user._id,
        {$push: {friends: friend._id}},
        {safe: true, upsert: true},
        function(err, model) {
          if (err) 
            res.send(err);
          res.json({message: 'Added friends'});
        }
      );
    });
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