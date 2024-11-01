const express = require('express');
const mongoose = require('mongoose');
const config = require('config');
const userRoutes = require('./routes/user');
const referralRoutes = require('./routes/referral');
const courseProgressRoutes = require('./routes/courseProgress');

const app = express();

// Connect to MongoDB
mongoose.connect(config.get('mongoURI'), {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/course-progress', courseProgressRoutes);

module.exports = app;
