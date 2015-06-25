var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('User', {
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String,
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }]
})