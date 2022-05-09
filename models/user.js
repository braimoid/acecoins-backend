var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  firstname: { type: String, default: ''},
  lastname: { type: String, default: ''},
  referral: { type: String, default: '' },
  refEarned: { type: Number, default: 0.0 },
  balance: { type: Number, default: 0.0 },
  profit: { type: Number, default: 0.0 },
  userStatus: { type: String, default: 'unverified' },
  role: { type: String, default: 'user' },
  pin: { type: Number  },
  verifyToken: { type: String },
  referralId: { type: String },
  investments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Investment',
    },
  ],
  referralPaid: { type: Boolean, default: false },
  created: { type: String, default: Date.now },
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },
});

UserSchema.plugin(passportLocalMongoose);
mongoose.models = {};
module.exports = mongoose.model('User', UserSchema);
