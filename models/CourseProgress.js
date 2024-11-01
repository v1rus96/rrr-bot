const mongoose = require('mongoose');

const CourseProgressSchema = new mongoose.Schema({
  userId: { type: String },
  courseId: { type: Number },
  moduleProgress: { type: mongoose.Schema.Types.Mixed },
  overallProgress: { type: Number, default: 0.0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CourseProgress', CourseProgressSchema);
