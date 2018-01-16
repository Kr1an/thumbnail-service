const mongoose = require('mongoose');

module.exports = mongoose.model(
  'JobRequest',
  new mongoose.Schema({
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
    thumbnailUrl: String,
  }),
);
