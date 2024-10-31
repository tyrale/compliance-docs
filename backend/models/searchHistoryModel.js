const mongoose = require('mongoose');

const searchHistorySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    query: {
      type: String,
      required: true,
    },
    filters: {
      type: Map,
      of: String,
    },
    results: [{
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'resultType',
    }],
    resultType: {
      type: String,
      enum: ['Document', 'Section'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
