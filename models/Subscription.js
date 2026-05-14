const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const SubscriptionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Mobile', 'Basic', 'Standard', 'Premium'], required: true },
    status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active' },
    start_date: { type: Date, default: Date.now },
    end_date: { type: Date, required: true },
    payment: { type: String, required: true } // Misal: "Credit Card", "Gopay"
}, { timestamps: true });
module.exports = mongoose.model('Subscription', SubscriptionSchema);