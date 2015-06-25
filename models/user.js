var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = new Schema({
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    email: String,
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }]
});

module.exports = User;