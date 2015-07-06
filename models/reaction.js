var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReactionSchema = new mongoose.Schema({
    message: String,
    from: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    to: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});


module.exports = mongoose.model('Reaction', ReactionSchema);
