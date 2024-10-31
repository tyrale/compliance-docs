const mongoose = require('mongoose');

const documentSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    versions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Version',
    }],
    currentVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Version',
    },
    sections: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    }],
    annotations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Annotation',
    }],
    metadata: {
      author: String,
      createdDate: Date,
      lastModified: Date,
      keywords: [String],
      category: String,
      status: {
        type: String,
        enum: ['draft', 'review', 'approved', 'archived'],
        default: 'draft',
      },
      version: {
        type: String,
        default: '1.0.0',
      },
      classification: {
        type: String,
        enum: ['public', 'internal', 'confidential', 'restricted'],
        default: 'internal',
      },
    },
    permissions: {
      readAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      writeAccess: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
      admin: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }],
    },
    stats: {
      viewCount: {
        type: Number,
        default: 0,
      },
      downloadCount: {
        type: Number,
        default: 0,
      },
      lastViewed: Date,
      lastDownloaded: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Add text index for search
documentSchema.index({
  title: 'text',
  'metadata.keywords': 'text',
  'metadata.category': 'text',
});

// Add compound indexes for efficient querying
documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ 'metadata.status': 1, 'metadata.classification': 1 });

// Pre-save middleware to update lastModified
documentSchema.pre('save', function(next) {
  this.metadata.lastModified = new Date();
  next();
});

// Instance method to check user permissions
documentSchema.methods.hasPermission = function(userId, permissionType = 'read') {
  const user = userId.toString();
  
  // Document owner has all permissions
  if (this.uploadedBy.toString() === user) {
    return true;
  }

  // Admin users have all permissions
  if (this.permissions.admin.some(id => id.toString() === user)) {
    return true;
  }

  switch (permissionType) {
    case 'read':
      return this.permissions.readAccess.some(id => id.toString() === user);
    case 'write':
      return this.permissions.writeAccess.some(id => id.toString() === user);
    default:
      return false;
  }
};

// Static method to find accessible documents
documentSchema.statics.findAccessible = function(userId, permissionType = 'read') {
  const accessField = permissionType === 'write' ? 'writeAccess' : 'readAccess';
  return this.find({
    $or: [
      { uploadedBy: userId },
      { [`permissions.${accessField}`]: userId },
      { 'permissions.admin': userId },
    ],
  });
};

module.exports = mongoose.model('Document', documentSchema);
