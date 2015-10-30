var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlanetSchema = new mongoose.Schema({
    name: String,
    description: String,
    image: String,
    owner: {type: Schema.Types.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Planet', PlanetSchema);
