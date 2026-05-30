const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  skillsRequired: [{ type: String }],
  tags: [{ type: String }],

  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { type: String, default: 'INR' },
    isNegotiable: { type: Boolean, default: false },
    period: { type: String, enum: ['hourly', 'monthly', 'yearly'], default: 'yearly' },
  },

  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'freelance', 'remote'],
    required: true,
  },

  experienceLevel: {
    type: String,
    enum: ['entry', 'junior', 'mid', 'senior', 'lead', 'executive'],
    required: true,
  },

  location: {
    city: String,
    state: String,
    country: { type: String, default: 'India' },
    isRemote: { type: Boolean, default: false },
  },

  deadline: { type: Date, required: true },
  openings: { type: Number, default: 1 },
  applicantsCount: { type: Number, default: 0 },

  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
  isDeleted: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
}, { timestamps: true });

jobSchema.index({ employer: 1 });
jobSchema.index({ status: 1, isDeleted: 1 });
jobSchema.index({ skillsRequired: 1 });
jobSchema.index({ employmentType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ 'location.city': 1 });
jobSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Job', jobSchema);
