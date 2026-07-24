// Generic, institution-agnostic configuration — no campus is hardcoded into
// app logic. Swap these lists (or later, back them with a DB table an admin
// can edit) to configure CampusVerse for any university.

export const CAMPUS_LOCATIONS = [
  "North Campus",
  "South Campus",
  "East Campus",
  "West Campus",
  "Main Gate",
  "Student Village",
  "Hill Residence",
  "Central Hostel",
  "Science Area",
  "Arts Area",
];

export const MARKETPLACE_CATEGORIES = [
  "Textbooks",
  "Past Questions",
  "Electronics",
  "Mattresses",
  "Kitchen Items",
  "Appliances",
  "Fashion",
  "Accessories",
  "Miscellaneous",
];

// Naira per day. Promotion "purchases" are simulated (see Promotion model) —
// this is the price list a real Paystack/Flutterwave/Monnify checkout would
// charge against once payments are wired up.
export const PROMOTION_PRICING = {
  PINNED: 300,
  HIGHLIGHTED: 200,
  FEATURED: 500,
};

export const REPORT_REASONS = [
  "Prohibited or unsafe item",
  "Suspected scam or fraud",
  "Misleading description",
  "Duplicate listing",
  "Other",
];
