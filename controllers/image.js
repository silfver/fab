// Load required packages
var Image = require('../models/image');

exports.processImage = function(req, res) {
  var image = new Image({
    image.cloudinary_id = req.query.image_id;
    image.by = req.query.user_id;
    image.reactions = [];
  });

};
