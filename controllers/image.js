// Load required packages
var Image = require('../models/image');

exports.register = function(req, res) {
  var image = new Image({
    cloudinary_id: req.query.image_id,
    by: req.query.user_id,
    reactions: []
  });
  image.save(function(err) {
    if (err)
      res.send(err);
    res.json({ message: 'Image registered OK' });
  });
};
exports.get = function(req, res) {
  var image_id = req.params.id;
  Image.findOne({_id: image_id}, function(err, image) {
    if (err)
      res.send(err);
    res.json(image);
  })
}

exports.getAll = function(req, res) {
Image.find(function(err, images) {
    if (err)
      res.send(err);

    res.json(images);
  });
}