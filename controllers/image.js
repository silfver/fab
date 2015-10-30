var url = require('url');
var fs = require('fs');
var cloudinary_vars = url.parse(process.env.CLOUDINARY_URL);
var crypto = require('crypto');
var Image = require('../models/image');
var User = require('../models/user');
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);

} else {
    var client = require("redis").createClient();
}
exports.register = function(req, res, next) {
  bump_ranking(req.user._id, 3);
  var users = JSON.parse(req.body.users);
  var image = new Image({
    cloudinary_id: req.body.cloudinary_id,
    by: req.user._id,
    reactions: [],
    hashtag: req.body.hashtag,
    planet: req.body.planet_id,
    filter: req.body.filter,
    link: req.body.link
  });
  users.forEach(function(user) {
    client.lpush(user+"_unseen", JSON.stringify([req.body.cloudinary_id, req.body.filter]), function(err, reply) {
      if (err) console.log(err); // silently fail and log here
    });
  });
  client.lpush(req.user._id+"_latest", req.body.cloudinary_id, function(err, size) {
    if (size > 10) {client.rpop(req.user_id+"_latest");}
  });
  image.save(function(err) {
    if (err) next(err);
    res.json({ message: 'Image registered OK' });
  });
};  
exports.get = function(req, res, next) {
  var image_id = req.params.id;
  Image.findOne({cloudinary_id: image_id}, function(err, image) {
    if (err) next(err);
    res.json(image);      
  })
}
exports.react = function(req, res, next) {
  var image_id = req.body.cloudinary_id;
  bump_ranking(req.user._id, 1);
  Image.findOne({cloudinary_id: image_id}, function(err, image) {
    var image_owner = image.by;
    var reaction_user_id = req.user._id;
    var reaction_message = req.body.reaction_message;
    var filter = image.filter;
    client.lpush(image_owner+"_reactions", JSON.stringify([reaction_user_id, image_id, reaction_message, filter]), function(err, size) {
      if (size > 10) {client.rpop(image_owner+"_reactions");}
    });
    client.lpush(image_id, JSON.stringify([reaction_user_id, reaction_message]), function(err, size) {
      if (err) next(err);
      if (size > 20) {client.rpop(image_id);}
      res.json({message: 'Reaction sent OK!'});        
    });

  });
}
exports.getReactions = function(req, res) {
  var image_id = req.params.id;
  client.lrange(image_id, 0, -1, function(err, reply) {
    res.json(reply);
  });
}

exports.getReactionList = function(req, res) {
  var userId = req.user._id;
  var reactions = [];
  client.lrange(userId+"_reactions", 0, -1, function(err, reply) {
    res.json(reply);
  });
}
exports.getAvailableReactions = function(req, res) {
  fs.readFile('reactions.json', 'utf8', function (err, data) {
    if (err) next(err);
    available_reactions = JSON.parse(data);
    var reactions = available_reactions[Math.floor(Math.random() * 23)];
    res.json(reactions);      
  })
}
exports.getAll = function(req, res) {
  Image.find(function(err, images) {
    if (err) next(err);
    res.json(images);
  });
}
exports.getHash = function(req, res) {
  var string = "timestamp="+req.body.timestamp+cloudinary_vars.auth.split(':')[1];
  var shasum = crypto.createHash('sha1');
  shasum.update(string);
  res.json(shasum.digest('hex'));
}

function bump_ranking(userId, amount) {
  User.findByIdAndUpdate(userId, {
    $inc: {"ranking": amount}
  }, function(err, user) {
  });
}