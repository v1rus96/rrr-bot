const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  username: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  languageCode: { type: String },
  points: { type: Number, default: 0 },
  onboarding: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
