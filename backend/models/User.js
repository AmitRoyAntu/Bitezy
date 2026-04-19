const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true }, // will be bcrypt hashed
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  isBlocked: { type: Boolean, default: false }, // Admin can block users

  // Buyer-specific fields
  buyerType: { type: String, enum: ['Student', 'Teacher', 'Staff'] },
  cuetId: { type: String },
  department: { type: String },
  residence: { type: String },

  // Seller-specific fields
  shopName: { type: String },
  location: { type: String },
  description: { type: String },
  openTime: { type: String },
  closeTime: { type: String },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

module.exports = User;
