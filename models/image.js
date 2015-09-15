var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ImageSchema = new mongoose.Schema({
    cloudinary_id: String,
    reactions: [{
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      reaction: String
    }],
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    users: [{type: Schema.Types.ObjectId, ref: 'User'}],
    hashtag: String
});

module.exports = mongoose.model('Image', ImageSchema);
