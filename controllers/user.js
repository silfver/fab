// Load required packages
var User = require('../models/user');
var Planet = require('../models/planet');
var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');
var crypto = require('crypto');
var _ = require('lodash');

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
    gender: req.body.gender,
    ranking: 0,
    postal_no: req.body.postal_no,
    profile_picture: req.body.profile_picture,
    email: req.body.email
  });
  user.save(function(err) {
    if(err) return next(err);
    Planet.findByIdAndUpdate(
      "56ec6fd366708a03003af7c7",
      {$addToSet: {followers: user._id}},
      {safe: false, upsert: true},
      function(err, model) {
        if(err) return next(err);
      }
    );
    res.json({ message: 'New user added' });
  });
};
exports.registerGcm = function(req, res, next) {
  var userId = req.user._id;
  var gcm_key = req.body.gcm_key;
  User.findByIdAndUpdate(userId, {
    $set: {"gcm_key": gcm_key}
  }, function(err, user) {
    if(err) return next(err);
    res.json({"message": "Gcm key registered!"});
  });

}
exports.getMe = function(req, res, next) {
  var userId = req.user._id;
  User.findOne({ _id: userId })
  .populate('friends')
  .exec(function (err, user) {
    if (err) next(err);
    res.json(user)
  });
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
exports.updateBackgroundImage = function(req, res, next) {
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
  var planetQuery = {name: new RegExp(partial_username, 'i')};
  User.find({$query: query, $orderby: { ranking : -1 }}, function(err, users) {
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
}
exports.getUnseenPlanetImages = function(req, res) {
  var user_id = req.user._id;
  client.lrange(user_id+"_planet_unseen", 0, -1, function(err, reply) {
    res.json(JSON.stringify(reply));
  });
}
// soon to be deprecated but keeping to make sure old apps work
exports.getNextUnseenImage = function(req, res) {
  var user_id = req.user._id;
  client.lpop(user_id+"_unseen", function(err, reply) {
    res.json(reply);
  });
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
  User.find({_id: friend_id, blocked: user_id}).lean().exec(function(err, friend) {
    if(err) return next(err);
    if (friend.length > 0) {
      res.sendStatus(401); // user is blocked from stalking
    }
    else {
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
  });
}
exports.block = function(req, res, next) {
  var user_id = req.user._id;
  var user_to_block = req.params.id;
  User.findByIdAndUpdate(user_id,
      {$addToSet: {blocked: user_to_block}},
      {safe: false, upsert: true},
      function(err, model) {
        if(err) return next(err);
        User.findByIdAndUpdate(user_id, 
        {$pull: {friends: user_to_block}},
          function(err, model) {
            if (err) return next(err);
            res.json({message: 'User blocked!'});
          }
        );
      }
    );
}
exports.unblock = function(req, res, next) {
  var user_id = req.user._id;
  var user_to_unblock = req.params.id;
  User.findByIdAndUpdate(user_id,
      {$pull: {blocked: user_to_unblock}},
      function(err, model) {
        if(err) return next(err);
        res.json({message: 'User unblocked!'});
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
// below to be deprecated in favour of all data sent at getMe()
exports.getFollowers = function(req, res, next) {
  var user_id = req.user._id;
  User.findOne({ _id: user_id })
  .populate('friends')
  .exec(function (err, user) {
    if (err) next(err);
    res.json(user)
  });
}
exports.getOtherFollowing = function(req, res, next) {
  var userId = req.params.id;
  User.find({friends: userId}, function(err, following) {
    if(err) return next(err);
    res.json(following);
  })
}
// below to be deprecated in favour of all data sent at getMe()
exports.getOtherFollowers = function(req, res, next) {
  var userId = req.params.id;
  User.findOne({ _id: userId })
  .populate('friends')
  .exec(function (err, user) {
    if (err) next(err);
    res.json(user)
  });
}

exports.getReactionList = function(req, res) {
  var userId = req.user._id;
  var reactions = [];
  client.lrange(userId+"_reactions_v2", 0, -1, function(err, reply) {
    res.json(reply);
  });
}
exports.getPlanets = function(req, res, next) {
  var user_id = req.user._id;
  Planet.find({followers: user_id })
  .exec(function (err, planets) {
    if (err) next(err);
    res.json(planets)
  });
}
// TODO remove later... 
exports.getUsers = function(req, res, next) {
  User.find(function(err, users) {
    if(err) return next(err);
    res.json(users);      
  });
};
exports.updateBio = function(req, res, next) {
  var userId = req.user._id;
  var bio_text = req.body.bio;
  User.findByIdAndUpdate(userId, {
    $set: {"bio": bio_text}
  }, function(err, user) {
    if(err) return next(err);
    res.json({"message": "Bio updated!"});
  });
}
exports.forgotPassword = function(req, res, next) {
  crypto.randomBytes(20, function(err, buf) {
    var token = buf.toString('hex');
    User.findOne({ email: req.body.email }, function(err, user) {
      if (!user) {
        return next("No such user exists");
      }
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000;
      user.save(function(err) {
        if (err) return next(err);
        var auth = {
          auth: {
            api_key: process.env.MAILGUN_KEY,
            domain: process.env.MAILGUN_DOMAIN
          }
        }
        var nodemailerMailgun = nodemailer.createTransport(mg(auth));
        nodemailerMailgun.sendMail({
          to: user.email,
          from: 'passwordreset@worldoffab.com',
          subject: 'Reset your Fab! password',
          html: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            '<a href="http://worldoffab.com/reset_password.html?' + token + '">https://worldoffab.com/reset_password.html?' + token +'</a>\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        },
        function(err, info) {
          if (err) return next(err);
          res.json("Password reset email sent");
        });
      });
    });
  });
}
exports.resetPassword = function(req, res, next) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (err) return next(err);
    if (!user) {
      res.json('Password reset token is invalid or has expired.');
      return next("no password");
    }
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.save(function(err) {
      if(err) return next(err);
      res.json({"message": "User changed password"});
    });
  });
}
exports.invite = function(req, res, next) {
  var user_id = req.user._id;
  var message = req.body.message;
  var email = req.body.email;
  var auth = {
        auth: {
          api_key: process.env.MAILGUN_KEY,
          domain: process.env.MAILGUN_DOMAIN
        }
      }
      var nodemailerMailgun = nodemailer.createTransport(mg(auth));
      User.findOne({_id: user_id}, function(err, user) {
        if(err) return next(err);
        nodemailerMailgun.sendMail({
        to: email,
        from: 'invite@worldoffab.com',
        subject: user.username+' wants to invite you to the World of Fab!',
        html: message+'\n\n' +
          'Go to https://worldoffab.com to get started\n\n'
        },
        function(err, info) {
          if (err) return next(err);
          res.json("Invite email sent");
        });
      });
}