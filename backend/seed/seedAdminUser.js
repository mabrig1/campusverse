/**
 * Seed script — creates the campusverse_user admin profile document
 * in the campusverse_db.users collection.
 *
 * Run once after MongoDB is connected:
 *   node backend/seed/seedAdminUser.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const ADMIN_DOCUMENT = {
  fullName:   'CampusVerse Admin',
  regNo:      'ADMIN/CV/2025/001',
  email:      'admin@campusverse.store',
  phone:      '+234-000-000-0000',

  department: 'Platform Operations',
  faculty:    'CampusVerse Nigeria',
  level:      '',
  hostel:     'CampusVerse HQ, Nsukka',
  university: 'University of Nigeria, Nsukka (UNN)',

  bio: 'Official CampusVerse platform administrator. Responsible for trust management, fraud monitoring, escrow oversight, and student identity verification across the UNN campus network.',

  skills: [
    'Platform Administration',
    'Trust & Safety',
    'Fraud Detection',
    'KYC Management',
    'Escrow Operations',
    'Student Support'
  ],

  avatarUrl: '',

  social: {
    twitter:  'campusverse_ng',
    linkedin: 'campusverse-nigeria',
    github:   'campusverse'
  },

  verification: {
    phoneVerified:     true,
    emailVerified:     true,
    studentIdVerified: true,
    selfieVerified:    true,
    ninVerified:       true,
    bvnVerified:       true
  },

  privacyConsent: {
    accepted:      true,
    policyVersion: '1.0',
    acceptedAt:    new Date('2025-06-04T00:00:00.000Z'),
    ipAddress:     '127.0.0.1',
    userAgent:     'SeedScript/1.0'
  },

  trustScore:   100,
  trustLevel:   'Elite Campus Partner',
  tradesCount:  0,
  disputeCount: 0,
  rating:       5.0,
  totalReviews: 0,

  role:     'admin',
  isActive: true,
  isBanned: false
};

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in your .env file.');
    process.exit(1);
  }

  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || 'campusverse_db'
  });
  console.log('Connected to campusverse_db');

  const existing = await User.findOne({ email: ADMIN_DOCUMENT.email });
  if (existing) {
    console.log('Admin user already exists — updating description fields only...');
    await User.updateOne(
      { email: ADMIN_DOCUMENT.email },
      { $set: {
          bio:          ADMIN_DOCUMENT.bio,
          skills:       ADMIN_DOCUMENT.skills,
          social:       ADMIN_DOCUMENT.social,
          trustScore:   ADMIN_DOCUMENT.trustScore,
          trustLevel:   ADMIN_DOCUMENT.trustLevel,
          verification: ADMIN_DOCUMENT.verification
        }
      }
    );
    console.log('Admin profile updated.');
  } else {
    const admin = new User(ADMIN_DOCUMENT);
    await admin.save();
    console.log('Admin user created successfully:');
    console.log(admin.toPublicProfile());
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
