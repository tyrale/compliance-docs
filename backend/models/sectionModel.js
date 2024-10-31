const mongoose = require('mongoose');

const sectionSchema = mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Document',
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    pageNumber: {
      type: Number,
      required: true,
    },
    position: {
      start: Number,
      end: Number,
    },
    summary: {
      type: String,
    },
    annotations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Annotation',
    }],
    parentSection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    },
    childSections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    }],
    metadata: {
      level: Number,
      order: Number,
      tags: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search
sectionSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Section', sectionSchema);
