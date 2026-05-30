const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  coverLetter: { type: String, maxlength: 2000 },

  resume: {
    url: String,
    publicId: String,
    originalName: String,
  },

  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'rejected', 'hired'],
    default: 'applied',
  },

  statusHistory: [{
    status: { type: String, enum: ['applied', 'shortlisted', 'rejected', 'hired'] },
    changedAt: { type: Date, default: Date.now },
    note: String,
  }],

  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ employer: 1 });
applicationSchema.index({ status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
