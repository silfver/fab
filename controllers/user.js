// Load required packages
var User = require('../models/user');

// Create endpoint /api/users for POST
exports.createNewUser = function(req, res) {
  var user = new User({
    username: req.username,
    password: req.password,
    firstName: req.firstName,
    lastName: req.lastName,
    postal_no: req.postal_no,
    email: req.email,
  });

  user.save(function(err) {
    if (err)
      res.send(err);

    res.json({ message: 'New user added' });
  });
};

// Create endpoint /api/users for GET
exports.getUsers = function(req, res) {
  User.find(function(err, users) {
    if (err)
      res.send(err);

    res.json(users);
  });
};