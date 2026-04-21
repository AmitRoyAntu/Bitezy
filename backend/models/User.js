const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  isBlocked: { type: Boolean, default: false },
}, { 
  discriminatorKey: 'role',
  timestamps: true 
});

const User = mongoose.model("User", userSchema);

// Buyer Discriminator
const Buyer = User.discriminator('buyer', new mongoose.Schema({
  buyerType: { type: String, enum: ['Student', 'Teacher', 'Staff'] },
  cuetId: { type: String },
  department: { type: String },
  residence: { type: String },
}));

// Seller Discriminator
const Seller = User.discriminator('seller', new mongoose.Schema({}));

// Admin Discriminator
const Admin = User.discriminator('admin', new mongoose.Schema({}));

module.exports = { User, Buyer, Seller, Admin };
