const mongoose = require('mongoose');

const JobRequest = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: [
      'success',
      'failed',
      'pending',
    ],
    default: 'pending',
  },
  thumbnailUrl: {
    type: String,
  },
});

module.exports = mongoose.model('JobRequest', JobRequest);