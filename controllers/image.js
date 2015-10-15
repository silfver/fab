var Image = require('../models/image');
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);

} else {
    var client = require("redis").createClient();
}
exports.register = function(req, res) {
  var users = JSON.parse(req.body.users);
  var image = new Image({
    cloudinary_id: req.body.cloudinary_id,
    by: req.user._id,
    reactions: [],
    hashtag: req.body.hashtag,
    planet: req.body.planet_id,
    filter: req.body.filter
  });
  users.forEach(function(user) {
    client.lpush(user+"_unseen", JSON.stringify([req.body.cloudinary_id, req.body.filter]), function(err, reply) {
      if (err)
        res.json(err);
    });
  });
  client.lpush(req.user._id+"_latest", req.body.cloudinary_id);
  image.save(function(err) {
    if (err)
      res.json(err);
    res.json({ message: 'Image registered OK' });
  });
};  
exports.get = function(req, res) {
  var image_id = req.params.id;
  Image.findOne({cloudinary_id: image_id}, function(err, image) {
    if (err)
      res.json(err);
    res.json(image);
  })
}
exports.react = function(req, res) {
  var image_id = req.body.cloudinary_id;
  Image.findOne({cloudinary_id: image_id}, function(err, image) {
    var image_owner = image.by;
    var reaction_user_id = req.user._id;
    var reaction_message = req.body.reaction_message;
    var filter = image.filter;
    client.lpush(image_owner+"_reactions", JSON.stringify([reaction_user_id, image_id, reaction_message, filter]), function(err, size) {
      if (size > 10) {client.rpop(image_owner+"_reactions");}
    });
    client.lpush(image_id, JSON.stringify([reaction_user_id, reaction_message]), function(err, size) {
      if (err)
        res.json(err);
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
  var available_reactions = [["fab", "superfab", "sad"],["nice","supernice","bad"], ["cool","epic","fail"],["chill","love it","wtf?!"], ["naw","so cute","omg"],
  ["classy","top","eeew"], ["boss","so boss","lame"]];
  var reactions = available_reactions[Math.floor(Math.random() * 6)];
  res.json(reactions);
}
exports.getAll = function(req, res) {
  Image.find(function(err, images) {
    if (err)
      res.json(err);
    res.json(images);
  });
}