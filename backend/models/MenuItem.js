const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true }, // e.g., Rice, Snacks, Fast Food
  price: { type: Number, required: true },
  desc: { type: String },
  img: { type: String },
  available: { type: Boolean, default: true },
}, { timestamps: true });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;