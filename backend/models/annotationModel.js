const mongoose = require('mongoose');

const annotationSchema = mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Document',
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Section',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    content: {
      type: String,
      required: true,
    },
    position: {
      start: Number,
      end: Number,
    },
    type: {
      type: String,
      enum: ['highlight', 'note', 'comment'],
      default: 'note',
    },
    metadata: {
      color: String,
      tags: [String],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Annotation', annotationSchema);
