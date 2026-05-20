const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  productId:  { type: Number, required: true },
  productName:String,
  size:       String,
  type:       { type: String, enum: ['restock','sale','return','adjustment','reserved'], required: true },
  qty:        { type: Number, required: true },
  before:     Number,
  after:      Number,
  note:       String,
  orderId:    String,
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
