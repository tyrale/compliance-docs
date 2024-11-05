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
      fullText: {
        type: String,
        required: true,
      },
      summary: {
        type: String,
        default: '',
      },
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
