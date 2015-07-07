var Image = require('../models/image');

exports.register = function(req, res) {
  var users = JSON.parse(req.body.users);
  var image = new Image({
    cloudinary_id: req.body.cloudinary_id,
    by: req.user._id,
    reactions: [],
    users: users
  });
  image.save(function(err) {
    if (err)
      console.log(err);
    res.json({ message: 'Image registered OK' });
  });
};
exports.get = function(req, res) {
  var image_id = req.params.id;
  Image.findOne({cloudinary_id: image_id}, function(err, image) {
    if (err)
      res.send(err);
    res.json(image);
  })
}
exports.react = function(req, res) {
  var image_id = req.body.cloudinary_id;
  var reaction_user_id = req.user._id;
  var reaction_message = req.body.reaction_message;

  Image.findOne({cloudinary_id: image_id}, function(err, image) {
    if (err)
      res.send(err);
    Image.findByIdAndUpdate(
      image._id,
      {$push: {reactions: {user: reaction_user_id, reaction: reaction_message}}},
      {safe: true, upsert: true},
      function(err, model) {
        if (err) 
          res.send(err);
        res.json({message: 'Added reaction OK'});
      }
    );
  });
}
exports.getAll = function(req, res) {
Image.find(function(err, images) {
    if (err)
      res.send(err);
    res.json(images);
  });
}