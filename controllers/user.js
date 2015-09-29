// Load required packages
var User = require('../models/user');
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
}
// Create endpoint /api/users for POST
exports.createNewUser = function(req, res) {
  var user = new User({
    username: req.body.username,
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    postal_no: req.body.postal_no,
    profile_picture: req.body.profile_picture,
    email: req.body.email
  });
  user.save(function(err) {
    if (err)
      res.json(err);
    res.json({ message: 'New user added' });
  });
};
exports.getMe = function(req, res) {
  var userId = req.user._id;
  User.findOne({_id: userId}, function(err, user) {
    if (err)
      res.json(err);
    res.json(user);
  })
};
exports.checkUsernameAvailable = function(req, res) {
  var username = req.params.username;
  User.findOne({ username: username }, function (err, user) {
    if (!user)
      res.json({message: "Username available!"});
    else
      res.json({message: "Username not available"}); 
  });
}
exports.getById = function(req, res) {
  var userId = req.params.id;
  User.findOne({_id: userId}, function(err, user) {
    if (err)
      res.json(err);
    res.json(user);
  })
};
exports.deleteUser = function(req, res) {
  var userId = req.user._id;
  User.remove({_id: userId}, function(err, user) {
    if (err)
      res.json(err);
    res.json({message: "User deleted OK!"});
  })
};
exports.deleteFriend = function(req, res) {
  var userId = req.user._id;
  var friendUserId = req.params.id;
  User.findByIdAndUpdate(userId, {
    $pull: {"friends": friendUserId}
  }, function(err, user) {
    if (err) 
      res.json(err);
    res.json({"message": "Friend removed OK!"});
  });
}
exports.stopFollowing = function(req, res) {
  var userId = req.user._id;
  var friendUserId = req.params.id;
  User.findByIdAndUpdate(friendUserId, {
    $pull: {"friends": userId}
  }, function(err, user) {
    if (err) 
      res.json(err);
    res.json({"message": "Stopped following OK!"});
  });
}
exports.updateProfileImage = function(req, res) {
  var userId = req.user._id;
  var cloudinary_id = req.params.id;
  User.findByIdAndUpdate(userId, {
    $set: {"profile_picture": cloudinary_id}
  }, function(err, user) {
    if (err) 
      res.json(err);
    res.json({"message": "Profile picture!"});
  });
}
exports.search = function(req, res) {
  var partial_username = req.params.username;
  var query = {username: new RegExp('^'+partial_username)};
  User.find(query, function(err, users) {
    if (err) 
      res.json(err);
    res.json(users);
  });
}
exports.getUnseenImages = function(req, res) {
  var user_id = req.user._id;
  client.lrange(user_id+"_unseen", 0, -1, function(err, reply) {
    res.json(JSON.stringify(reply));
  });
  client.del(user_id+"_unseen");
}
exports.getLatestImage = function(req, res) {
  var user_id = req.user._id;
  client.get(user_id+"_latest", function(err, reply) {
    res.json(JSON.stringify(reply));
  });
}
exports.getNewFriends = function(req, res) {
  var user_id = req.user._id;
  client.lrange(user_id+"_new_friends",0, -1, function(err, reply) {
    res.json(JSON.stringify(reply));
  });
  client.del(user_id+"_new_friends");
}
exports.startFollowing = function(req, res) {
  var user_id = req.user._id;
  User.findOne({username: req.body.friend}, function(err, friend){
    friend_id = friend._id;
    if (err)
      res.json(err);
    User.findByIdAndUpdate(
      friend_id,
      {$addToSet: {friends: user_id}},
      {safe: false, upsert: true},
      function(err, model) {
        if (err) 
          res.json(err);
        client.lpush(friend_id+"_new_friends", user_id, function(err, reply) {
          if (err)
            res.json(err);
          res.json({message: 'Added friends'});
        });
      }
    );
  });
};
exports.getFollowing = function(req, res) {
  var user_id = req.user._id;
  User.find({friends: user_id}, function(err, following) {
    if (err)
      res.json(err);
    res.json(following);
  })
}
exports.getUsers = function(req, res) {
  User.find(function(err, users) {
    if (err)
      res.json(err);
    res.json(users);
  });
};