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
    email: req.email,
  });
  user.save(function(err) {
    if (err)
      res.send(err);
    res.json({ message: 'New user added' });
  });
};

exports.addFriendToUser = function(req, res) {
  var username = req.query.username;
  User.findOne({username: req.query.friend}, function(err, friend){
    User.findOne({username: username}, function(err, user) {
      User.update({_id: user._id}, {$push: { friends: friend._id }})
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