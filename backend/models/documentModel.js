const mongoose = require('mongoose');

const documentSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Document', documentSchema);
