// Load required packages
var Planet = require('../models/planet');
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
}
// Create endpoint /api/users for POST
exports.createNewPlanet = function(req, res) {
  var planet = new Planet({
    name: req.body.name,
    description: req.body.description,
    image: req.body.image,
    owner: req.user._id
  });
  planet.save(function(err) {
    if (err)
      res.json(err);
    res.json({ message: 'New planet added' });
  });
};

exports.getById = function(req, res) {
  var planet_id = req.params.id;
  Planet.findOne({_id: planet_id}, function(err, planet) {
    if (err)
      res.json(err);
    res.json(planet);
  })
};
exports.deletePlanet = function(req, res) {
  var planet_id = req.params.id;
  Planet.remove({_id: planet_id}, function(err, planet) {
    if (err)
      res.json(err);
    res.json({message: "Planet deleted OK!"});
  })
};

exports.search = function(req, res) {
  var partial_username = req.params.username.toLowerCase();;
  var query = {username: new RegExp('^'+partial_username, 'i')};
  Planet.find(query, function(err, users) {
    if (err) 
      res.json(err);
    res.json(users);
  });
}

exports.startFollowing = function(req, res) {
  var user_id = req.user._id;
  var planet_id = req.body.id;
  User.findByIdAndUpdate(
    user_id,
    {$addToSet: {planets: planet_id}},
    {safe: false, upsert: true},
    function(err, model) {
      if (err) 
        res.json(err);
      res.json({message: 'Added planet'});
    }
  );
};
exports.getPlanets = function(req, res) {
  Planet.find(function(err, planets) {
    if (err)
      res.json(err);
    res.json(planets);
  });
};
