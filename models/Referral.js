const mongoose = require('mongoose');

const ReferralSchema = new mongoose.Schema({
  userId: { type: String },
  referrerId: { type: String }
});

module.exports = mongoose.model('Referral', ReferralSchema);
