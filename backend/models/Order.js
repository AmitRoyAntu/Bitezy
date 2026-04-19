const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String },
    price: { type: Number, min: [0, 'Item price cannot be negative'] },
    qty: { type: Number, min: [1, 'Quantity must be at least 1'] },
    img: { type: String },
  }],
  subtotal: { type: Number, required: true, min: [0, 'Subtotal cannot be negative'] },
  deliveryFee: { type: Number, default: 0, min: [0, 'Delivery fee cannot be negative'] },
  total: { type: Number, required: true, min: [0, 'Total cannot be negative'] },
  type: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
  status: { 
    type: String, 
    enum: ['PENDING', 'PREPARING', 'READY', 'ON_THE_WAY', 'DELIVERED', 'PICKED_UP', 'CANCELLED'], 
    default: 'PENDING' 
  },
  deliveryAddress: { type: String },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
