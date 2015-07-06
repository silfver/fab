// Load required packages
var Reaction = require('../models/reaction');

// Create endpoint /api/users for POST
exports.sendReaction = function(req, res) {
  var reaction = new Reaction({
    message: req.query.message,
    from: req.query.from,
    to: req.query.to,
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