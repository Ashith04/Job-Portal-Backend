const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const educationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: String,
  startYear: Number,
  endYear: Number,
  grade: String,
}, { _id: true });

const experienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  title: { type: String, required: true },
  location: String,
  startDate: Date,
  endDate: Date,
  current: { type: Boolean, default: false },
  description: String,
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'employer', 'jobseeker'], default: 'jobseeker' },
  isBlocked: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  avatar: { type: String, default: '' },

  // Job Seeker fields
  headline: String,
  bio: String,
  phone: String,
  location: String,
  skills: [{ type: String }],
  education: [educationSchema],
  experience: [experienceSchema],
  resume: {
    url: String,
    publicId: String,
    originalName: String,
    uploadedAt: Date,
  },

  // Employer fields
  company: {
    name: String,
    website: String,
    industry: String,
    size: String,
    description: String,
    logo: String,
    location: String,
    founded: Number,
  },

  lastLogin: Date,
}, { timestamps: true });

userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1, isDeleted: 1 });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
