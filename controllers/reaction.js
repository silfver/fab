// Load required packages
var Reaction = require('../models/reaction');

// Create endpoint /api/users for POST
exports.sendReaction = function(req, res) {
  var reaction = new Reaction({
    message: req.query.message,
    from: req.query.from,
    to: req.query.to,
  });
};
