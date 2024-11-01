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
    startPage: {
      type: Number,
      required: true,
    },
    endPage: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    summary: {
      type: String,
      default: '',
    },
    nlpMetadata: {
      summaryConfidence: {
        type: Number,
        default: 0,
      },
      sentiment: {
        sentiment: {
          type: String,
          enum: ['positive', 'negative', 'neutral'],
          default: 'neutral',
        },
        confidence: {
          type: Number,
          default: 0,
        },
      },
      keyPhrases: [{
        type: String,
      }],
      classification: {
        categories: [{
          type: String,
        }],
        confidence: {
          type: Number,
          default: 0,
        },
      },
      lastAnalyzed: {
        type: Date,
      },
    },
    metadata: {
      wordCount: {
        type: Number,
        default: 0,
      },
      readingTime: {
        type: Number, // in minutes
        default: 0,
      },
      complexity: {
        type: String,
        enum: ['basic', 'intermediate', 'advanced'],
        default: 'intermediate',
      },
      keywords: [{
        type: String,
      }],
      lastModified: {
        type: Date,
        default: Date.now,
      },
    },
    references: [{
      type: {
        type: String,
        enum: ['internal', 'external'],
        required: true,
      },
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
      },
      url: String,
      description: String,
    }],
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'archived'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to update metadata
sectionSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Update word count
    this.metadata.wordCount = this.content.split(/\s+/).length;
    
    // Update reading time (assuming average reading speed of 200 words per minute)
    this.metadata.readingTime = Math.ceil(this.metadata.wordCount / 200);
    
    // Update complexity based on word count and average word length
    const words = this.content.split(/\s+/);
    const avgWordLength = words.join('').length / words.length;
    
    if (avgWordLength < 5) {
      this.metadata.complexity = 'basic';
    } else if (avgWordLength > 7) {
      this.metadata.complexity = 'advanced';
    } else {
      this.metadata.complexity = 'intermediate';
    }
    
    this.metadata.lastModified = new Date();
  }
  next();
});

// Index for text search
sectionSchema.index({
  title: 'text',
  content: 'text',
  'metadata.keywords': 'text',
});

// Compound indexes for efficient querying
sectionSchema.index({ document: 1, startPage: 1 });
sectionSchema.index({ document: 1, status: 1 });

module.exports = mongoose.model('Section', sectionSchema);
