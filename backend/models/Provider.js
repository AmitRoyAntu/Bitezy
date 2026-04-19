const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Canteen', 'Cafeteria', 'Cart'], default: 'Canteen' },
  img: { type: String },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: { type: String },
  rating: { type: Number, default: 0 },
  deliveryTime: { type: String },
  isOpen: { type: Boolean, default: true },
  description: { type: String },
  openTime: { type: String },
  closeTime: { type: String },
}, { timestamps: true });

const Provider = mongoose.model("Provider", providerSchema);

module.exports = Provider;
