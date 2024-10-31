const mongoose = require('mongoose');

const versionSchema = mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Document',
    },
    versionNumber: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    changeLog: {
      type: String,
      required: true,
    },
    metadata: {
      fileSize: Number,
      hash: String,
      lastModified: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Version', versionSchema);
