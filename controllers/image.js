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
    reactions: []
  });
  users.forEach(function(user) {
    console.log(user, req.body.cloudinary_id);
    client.lpush(user, req.body.cloudinary_id, function(err, reply) {
      if (err)
        res.json(err);
      console.log(err, reply);
    });
  });
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
  var reaction_user_id = req.user._id;
  var reaction_message = req.body.reaction_message;
  client.lpush(image_id, JSON.stringify([reaction_user_id, reaction_message]), function(err, reply) {
    if (err)
      res.json(err);
    console.log(reply);
    res.json({message: 'Reaction sent OK!'});
  });
  Image.findOne({cloudinary_id: image_id}, function(err, image) {
    if (err)
      res.json(err);
    Image.findByIdAndUpdate(
      image._id,
      {$push: {reactions: {user: reaction_user_id, reaction: reaction_message}}},
      {safe: true, upsert: true},
      function(err, model) {
        if (err) 
          res.json(err);
        //res.json({message: 'Reaction sent OK'});
      }
    );
  });
}
exports.getReactions = function(req, res) {
  var image_id = req.params.id;
  client.lrange(image_id, 0, -1, function(err, reply) {
    res.json(reply);
  });
}
exports.getAvailableReactions = function(req, res) {
  var reactions = ["Fab", "Superfab", "Sad"];
  json.send(reactions);
}
exports.getAll = function(req, res) {
  Image.find(function(err, images) {
    if (err)
      res.json(err);
    res.json(images);
  });
}