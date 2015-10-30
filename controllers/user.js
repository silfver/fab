// Load required packages
var User = require('../models/user');
var Planet = require('../models/planet');

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
}
// Create endpoint /api/users for POST
exports.createNewUser = function(req, res, next) {
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
    if(err) return next(err);
    res.json({ message: 'New user added' });
  });
};
exports.getMe = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({_id: userId}, function(err, user) {
    if(err) return next(err);
    res.json(user);
  })
};
exports.checkUsernameAvailable = function(req, res, next) {
  var username = req.params.username;
  User.findOne({ username: username }, function (err, user) {
    if (!user)
      res.json({message: "Username available!"});
    else
      res.json({message: "Username not available"}); 
  });
}
exports.getById = function(req, res, next) {
  var userId = req.params.id;
  User.findOne({_id: userId}, function(err, user) {
    if(err) return next(err);
    res.json(user);
  })
};
exports.deleteUser = function(req, res, next) {
  var userId = req.user._id;
  User.remove({_id: userId}, function(err, user) {
    if(err) return next(err);
    res.json({"message": "User deleted OK!"});
  })
};
exports.deleteFollower = function(req, res, next) {
  var userId = req.user._id;
  var friendUserId = req.params.id;
  User.findByIdAndUpdate(userId, {
    $pull: {"friends": friendUserId}
  }, function(err, user) {
    if(err) return next(err);
    res.json({"message": "Follower deleted OK!"});
  });
}
exports.stopFollowing = function(req, res, next) {
  var userId = req.user._id;
  var friendUserId = req.params.id;
  User.findByIdAndUpdate(friendUserId, {
    $pull: {"friends": userId}
  }, function(err, user) {
    if(err) return next(err);
    res.json({"message": "Stopped following OK!"});
  });
}
exports.updateProfileImage = function(req, res, next) {
  var userId = req.user._id;
  var cloudinary_id = req.params.id;
  User.findByIdAndUpdate(userId, {
    $set: {"profile_picture": cloudinary_id}
  }, function(err, user) {
    if(err) return next(err);
    res.json({"message": "Profile picture updated!"});
  });
}
exports.updateProfileImage = function(req, res, next) {
  var userId = req.user._id;
  var cloudinary_id = req.params.id;
  User.findByIdAndUpdate(userId, {
    $set: {"background_picture": cloudinary_id}
  }, function(err, user) {
    if(err) return next(err);
    res.json({"message": "Background picture updated!"});
  });
}
exports.search = function(req, res, next) {
  var total_return = [];
  var partial_username = req.params.username.toLowerCase();;
  var query = {username: new RegExp('^'+partial_username, 'i')};
  var planetQuery = {name: new RegExp('^'+partial_username, 'i')};
  User.find(query, function(err, users) {
    if(err) return next(err);
    Planet.find(planetQuery, function(err, planets) {
      if(err) return next(err);
      total_return = users.concat(planets);
      res.json(total_return);
    });  
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
  client.lrange(user_id+"_latest", 0, -1, function(err, reply) {
    res.json(reply);
  });
}
exports.getNewFollowers = function(req, res) {
  var user_id = req.user._id;
  client.lrange(user_id+"_new_friends",0, -1, function(err, reply) {
    res.json(JSON.stringify(reply));
  });
  client.del(user_id+"_new_friends");
}
exports.startFollowing = function(req, res, next) {
  var user_id = req.user._id;
  var friend_id = req.body.friend;
  User.findByIdAndUpdate(
    friend_id,
    {$addToSet: {friends: user_id}},
    {safe: false, upsert: true},
    function(err, model) {
      if(err) return next(err);
      client.lpush(friend_id+"_new_friends", user_id, function(err, reply) {
        if(err) return next(err);
        res.json({message: 'Started following OK!'});
      });    
    }
  );
}
exports.getFollowing = function(req, res, next) {
  var user_id = req.user._id;
  User.find({friends: user_id}, function(err, following) {
    if(err) return next(err);
    res.json(following);
  })
}
exports.getFollowers = function(req, res, next) {
  var user_id = req.user._id;
  User.findOne({ _id: user_id })
  .populate('friends')
  .exec(function (err, user) {
    if (err) next(err);
    res.json(user)
  });
}
exports.getPlanets = function(req, res, next) {
  var user_id = req.user._id;
  User.findOne({ _id: user_id })
  .populate('planets')
  .exec(function (err, user) {
    if (err) next(err);
    res.json(user.planets)
  });
}
exports.getUsers = function(req, res, next) {
  User.find(function(err, users) {
    if(err) return next(err);
    res.json(users);      
  });
};