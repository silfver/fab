var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var UserSchema = new mongoose.Schema({
    username: {
      type:String,
      index: true,
      required: true,
      unique: true
    },
    password: {
      type:String,
      required:true
    },
    firstName: String,
    lastName: String,
    gender: String,
    postal_no: String,
    profile_picture: String,
    background_picture: String,
    blocked: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    bio: String,
    email: {
      type: String,
      required: true,
      unique: true  
    },
    ranking: Number,
    gcm_key: String,
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    resetPasswordToken: String,
    resetPasswordExpires: Date
  });

UserSchema.methods.verifyPassword = function(password, cb) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

// Execute before each user.save() call
UserSchema.pre('save', function(callback) {
  var user = this;

  // Break out if the password hasn't changed
  if (!user.isModified('password')) return callback();

  // Password changed so we need to hash it
  bcrypt.genSalt(5, function(err, salt) {
    if (err) return callback(err);

    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return callback(err);
      user.password = hash;
      callback();
    });
  });
});


module.exports = mongoose.model('User', UserSchema);
