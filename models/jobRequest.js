const mongoose = require('mongoose');

const JobRequest = mongoose.model(
  'JobRequest',
  new mongoose.Schema({
    thumbnailUrl: String,
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
  }),
);

module.exports = JobRequest;
