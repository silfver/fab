var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlanetSchema = new mongoose.Schema({
    name: String,
    description: String,
    image: String
});

module.exports = mongoose.model('Planet', PlanetSchema);
