// Load required packages
var Planet = require('../models/planet');
var User = require('../models/user');
if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var client = require("redis").createClient(rtg.port, rtg.hostname);
  client.auth(rtg.auth.split(":")[1]);
} else {
    var client = require("redis").createClient();
}
// Create endpoint /api/users for POST
exports.createNewPlanet = function(req, res, next) {
  var planet = new Planet({
    name: req.body.name,
    description: req.body.description,
    image: req.body.image,
    owner: req.user._id
  });
  planet.save(function(err) {
    if(err) return next(err);
    res.json({ message: 'New planet added' });
  });
};

exports.getById = function(req, res, next) {
  var planet_id = req.params.id;
  Planet.findOne({_id: planet_id}, function(err, planet) {
    if(err) return next(err);
    res.json(planet);
  })
};
exports.deletePlanet = function(req, res, next) {
  var planet_id = req.params.id;
  Planet.remove({_id: planet_id}, function(err, planet) {
    if(err) return next(err);
    res.json({message: "Planet deleted OK!"});
  })
};

exports.startFollowing = function(req, res, next) {
  var user_id = req.user._id;
  var planet_id = req.body.id;
  Planet.update(
    planet_id,
    {$addToSet: {followers: user_id}},
    {safe: false, upsert: true},
    function(err, model) {
      if(err) return next(err);
      res.json({message: 'Added planet'});
    }
  );
};
exports.stopFollowing = function(req, res, next) {
  var userId = req.user._id;
  var planet_id = req.params.id;
  Planet.findByIdAndUpdate(planet_id, {
    $pull: {followers: userId}
  }, function(err, user) {
    if(err) return next(err);
    res.json({"message": "Stopped following OK!"});
  });
}
exports.getPlanets = function(req, res, next) {
  Planet.find(function(err, planets) {
    if(err) return next(err);
    res.json(planets);
  });
};
exports.getLatestById = function(req, res, next) {
  var planet_id = req.params.id;
  client.lrange(planet_id+"_planet_latest", 0, -1, function(err, reply) {
    res.json(reply);
  });
}
