import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // ── Core Identity ──────────────────────────────────────────
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    regNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },

    // ── Academic Profile ───────────────────────────────────────
    department: {
      type: String,
      trim: true,
      default: ''
    },
    faculty: {
      type: String,
      trim: true,
      default: ''
    },
    level: {
      type: String,
      enum: ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', 'Postgraduate', ''],
      default: ''
    },
    hostel: {
      type: String,
      trim: true,
      default: ''
    },
    university: {
      type: String,
      default: 'University of Nigeria, Nsukka (UNN)'
    },

    // ── Public Description ─────────────────────────────────────
    bio: {
      type: String,
      maxlength: 300,
      default: ''
    },
    skills: {
      type: [String],
      default: []
    },
    avatarUrl: {
      type: String,
      default: ''
    },

    // ── Social Links (optional) ────────────────────────────────
    social: {
      twitter:  { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github:   { type: String, default: '' }
    },

    // ── KYC & Verification Flags ───────────────────────────────
    verification: {
      phoneVerified:     { type: Boolean, default: false },
      emailVerified:     { type: Boolean, default: false },
      studentIdVerified: { type: Boolean, default: false },
      selfieVerified:    { type: Boolean, default: false },
      ninVerified:       { type: Boolean, default: false },
      bvnVerified:       { type: Boolean, default: false }
    },

    // ── Privacy Policy Consent ─────────────────────────────────
    privacyConsent: {
      accepted:      { type: Boolean, default: false },
      policyVersion: { type: String, default: '' },
      acceptedAt:    { type: Date, default: null },
      ipAddress:     { type: String, default: '' },
      userAgent:     { type: String, default: '' }
    },

    // ── Trust & Reputation ─────────────────────────────────────
    trustScore:   { type: Number, default: 25, min: 0, max: 100 },
    trustLevel:   { type: String, default: 'Unverified Student' },
    tradesCount:  { type: Number, default: 0 },
    disputeCount: { type: Number, default: 0 },
    rating:       { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },

    // ── Account Status ─────────────────────────────────────────
    role: {
      type: String,
      enum: ['student', 'admin', 'moderator'],
      default: 'student'
    },
    isActive:  { type: Boolean, default: true },
    isBanned:  { type: Boolean, default: false },
    banReason: { type: String, default: '' }
  },
  {
    timestamps: true,     // adds createdAt and updatedAt automatically
    collection: 'users'   // explicit collection name in campusverse_db
  }
);

// ── Indexes ────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ regNo: 1 });
userSchema.index({ trustScore: -1 });

// ── Instance helper: public-safe view ─────────────────────────
userSchema.methods.toPublicProfile = function () {
  return {
    _id:          this._id,
    fullName:     this.fullName,
    regNo:        this.regNo,
    department:   this.department,
    faculty:      this.faculty,
    level:        this.level,
    hostel:       this.hostel,
    university:   this.university,
    bio:          this.bio,
    skills:       this.skills,
    avatarUrl:    this.avatarUrl,
    social:       this.social,
    trustScore:   this.trustScore,
    trustLevel:   this.trustLevel,
    tradesCount:  this.tradesCount,
    rating:       this.rating,
    totalReviews: this.totalReviews,
    verification: this.verification,
    joinedDate:   this.createdAt
  };
};

export default mongoose.model('User', userSchema);
