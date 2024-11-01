// models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  text: String,
  mediaId: String,
  mediaType: String // e.g., 'photo' or 'video'
});

module.exports = mongoose.model('Message', MessageSchema);
