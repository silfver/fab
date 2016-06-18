var url = require('url');
var fs = require('fs');
var async = require('async');
var cloudinary = require('cloudinary');
var cloudinary_vars = url.parse(process.env.CLOUDINARY_URL);
var crypto = require('crypto');
var Image = require('../models/image');
var User = require('../models/user');
var Planet = require('../models/planet');
var ObjectId = require('mongoose').Types.ObjectId;
var gcm = require('node-gcm');
var sender = new gcm.Sender(process.env.GCM_API_KEY);

cloudinary.config({ 
    cloud_name: cloudinary_vars.hostname, 
    api_key: cloudinary_vars.auth.split(':')[0], 
    api_secret: cloudinary_vars.auth.split(':')[1]
});

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
}

exports.deleteOld = function(req, res, next) {
  var query = {};
  var cloudinary_image_array = [];
  Image.find({$query: query, $orderby: { $natural : 1 }}, function(err, images) {
    images_to_delete = images.slice(1, 30);
    images_to_delete.forEach(function(image){
      Image.remove({"cloudinary_id": image.cloudinary_id}, function(err, images){
      });
      cloudinary_image_array.push(image.cloudinary_id);
    });
    cloudinary.api.delete_resources(cloudinary_image_array, function(result){
      res.json(result);
    });    
  });
}

exports.register = function(req, res, next) {
  bump_ranking(req.user._id, 3);
  var users_sent_to = 0;
  var users = JSON.parse(req.body.users);
  var planets = JSON.parse(req.body.planets);
  var image = new Image({
    cloudinary_id: req.body.cloudinary_id,
    by: req.user._id,
    reactions: [],
    hashtag: req.body.hashtag,
    hashtag_height: req.body.hashtag_height,
    filter: req.body.filter,
    link: req.body.link
  });
  // create message for push notification
  var message = new gcm.Message();
  var registrationIds = [];
  message.addData('message',"you have a few fab!");
  message.addData('title','OMG new fab!' );
  message.addData('msgcnt','3');
  message.timeToLive = 3000;

  // send out to the planets!
  planets.forEach(function(planet_id){
    Planet.findOne({_id: planet_id}, function(err, planet) {
      if(err) return next(err);
      planet.followers.forEach(function(follower){
        if (follower != req.user._id) {   // don't add to current users own queue
          client.lpush(follower+"_planet_unseen", JSON.stringify([req.body.cloudinary_id, req.body.filter]), function(err, reply) {
            if (err) console.log(err); // silently fail and log here
          });          
        }
      });
    });
  });
  // send out to users!
  users.forEach(function(user) {
    User.findOne({_id: user}, function(err, user) {
      client.lpush(user._id+"_unseen", JSON.stringify([req.body.cloudinary_id, req.body.filter]), function(err, reply) {
        if (err) console.log(err); // silently fail and log here
      });
      // If user has gcm_key they accept push notifications. Add to queue and let worker process do the rest
      if (user.gcm_key) {
        registrationIds.push(user.gcm_key);
      }
      users_sent_to++;
      if (users_sent_to == users.length) {
        sender.send(message, registrationIds, 4, function (result) {
          console.log(result);
        });
      }
    });
  });
  // add to users' own latest images
  client.lpush(req.user._id+"_latest", JSON.stringify([req.body.cloudinary_id, req.body.filter]), function(err, size) {
    if (size > 10) {client.rpop(req.user_id+"_latest");}
  });

  image.save(function(err) {
    if (err) next(err);
    res.json({ message: 'Image registered OK' });
  });
};
exports.getUnseenReactionsNumber = function(req, res, next) {
  var userId = req.user._id;
  client.get(userId+"_number_of_unseen_reactions", function(err, reply) {
    if (err) next(err);
    client.set(userId+"_number_of_unseen_reactions", 0);
    res.json(reply);
  });
}

exports.get = function(req, res, next) {
  var image_id = req.params.id;
  Image.findOne({ cloudinary_id: image_id })
  .populate('by')
  .exec(function (err, image) {
    if (err) next(err);
    res.json(image);
  });
}
exports.report = function(req, res, next) {
  var image_id = req.body.cloudinary_id;
  var user_id = req.user._id;
  Image.findOne({ cloudinary_id: image_id }, function(err, image) {
    if(err) next(err);
    client.lrem(user_id+"_unseen", 0, JSON.stringify([image_id, image.filter]), function(err) {
      if(err) next(err);
      res.json({message: 'Image reported!'});
    });
  });
}
exports.react_v2 = function(req, res, next) {
  var image_id = req.body.cloudinary_id;
  var user_id = req.user._id;
  bump_ranking(user_id, 1);
  
  Image.findOne({cloudinary_id: image_id}, function(err, image) {
    var image_owner = image.by;
    var reaction_message = req.body.reaction_message;
    var reaction_username = req.body.username;
    var reaction_profile_picture = req.body.profile_picture;
    var filter = image.filter;
    // push notification
    var message = new gcm.Message();
    var registrationIds = [];
    message.addData('message', reaction_username+" says "+reaction_message);
    message.addData('title', "new reaction!");
    message.addData('msgcnt','3');
    message.addData('soundname','beep.wav'); 
    message.timeToLive = 3000;
    User.findOne({_id: image_owner}, function(err, user) {
      if (user.gcm_key) {
        registrationIds.push(user.gcm_key);
        sender.send(message, registrationIds, 4, function (result) {
          console.log(result);
        });
      }
    });
    client.lrem(user_id+"_unseen", 0, JSON.stringify([image_id, image.filter]), function(err) {
      if(err) next(err);
    });
    client.lrem(user_id+"_planet_unseen", 0, JSON.stringify([image_id, image.filter]), function(err) {
      if(err) next(err);
    });
    client.lpush(image_owner+"_reactions_v2", JSON.stringify([reaction_username, reaction_profile_picture, image_id, reaction_message, filter]), function(err, size) {
      if (size > 10) {client.rpop(image_owner+"_reactions_v2");}
    });
    client.incr(image_owner+"_number_of_unseen_reactions");
      // create message for push notification
    client.lpush(image_id+"_image_reactions", JSON.stringify([reaction_username, reaction_profile_picture, reaction_message]), function(err, size) {
      if (err) next(err);
      if (size > 20) {client.rpop(image_id);}
      res.json({message: 'Reaction sent OK!'});        
    });
  });
}
// Legacy version of reactions

exports.react = function(req, res, next) {
  var image_id = req.body.cloudinary_id;
  var user_id = req.user._id;
  bump_ranking(user_id, 1);
  Image.findOne({cloudinary_id: image_id}, function(err, image) {
    var image_owner = image.by;
    var reaction_user_id = req.user._id;
    var reaction_message = req.body.reaction_message;
    var filter = image.filter;
    client.lrem(user_id+"_unseen", 0, JSON.stringify([image_id, image.filter]), function(err) {
      if(err) next(err);
    });
    client.lrem(user_id+"_planet_unseen", 0, JSON.stringify([image_id, image.filter]), function(err) {
      if(err) next(err);
    });
    client.lpush(image_owner+"_reactions", JSON.stringify([reaction_user_id, image_id, reaction_message, filter]), function(err, size) {
      if (size > 10) {client.rpop(image_owner+"_reactions");}
    });
    client.incr(image_owner+"_number_of_unseen_reactions");
    client.lpush(image_id, JSON.stringify([reaction_user_id, reaction_message]), function(err, size) {
      if (err) next(err);
      if (size > 20) {client.rpop(image_id);}
      res.json({message: 'Reaction sent OK!'});        
    });
  });
}
// Legacy version of reactions
exports.getReactions = function(req, res) {
  var image_id = req.params.id;
  client.lrange(image_id, 0, -1, function(err, reply) {
    res.json(reply);
  });
}
// New version of reactions
exports.getNewReactions = function(req, res) {
  var image_id = req.params.id;
  client.lrange(image_id+"_image_reactions", 0, -1, function(err, reply) {
    res.json(reply);
  });
}
exports.getAvailableReactions = function(req, res) {
  fs.readFile('reactions.json', 'utf8', function (err, data) {
    if (err) next(err);
    available_reactions = JSON.parse(data);
    console.log(available_reactions.length);
    // Make distribution heavier in the short end by min(X,Y), X,Y uncorrelated random variables.
    var reactions = available_reactions[Math.floor(Math.min(Math.random(), Math.random()) * available_reactions.length)];
    res.json(reactions);      
  })
}
exports.getAll = function(req, res) {
  Image.find(function(err, images) {
    if (err) next(err);
    res.json(images);
  });
}
// soon to be legacy because of new function in usercontroller
exports.getReactionList = function(req, res) {
  var userId = req.user._id;
  var reactions = [];
  client.lrange(userId+"_reactions", 0, -1, function(err, reply) {
    res.json(reply);
  });
}
exports.getHash = function(req, res) {
  var string = "timestamp="+req.body.timestamp+cloudinary_vars.auth.split(':')[1];
  var shasum = crypto.createHash('sha1');
  shasum.update(string);
  res.json(shasum.digest('hex'));
}
exports.delete = function(req, res) {
  var image_id = req.params.id;
  var userId = req.user._id;
  Image.remove({cloudinary_id: image_id }, function(err) {
    if (err) next(err);
    res.json({message: "Image removed OK!"});
  });
}

function bump_ranking(userId, amount) {
  User.findByIdAndUpdate(userId, {
    $inc: {"ranking": amount}
  }, function(err, user) {
  });
}
