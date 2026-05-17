const mongoose2 = require('mongoose');

// Membuat "cetakan" data Langganan
const SubscriptionSchema = new mongoose2.Schema({
    // user_id ini gunanya untuk menyambungkan langganan ini dengan siapa pembelinya (diambil dari tabel User)
    user_id: { type: mongoose2.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Tipe langganan, isinya HANYA BOLEH salah satu dari yang ada di dalam enum
    type: { type: String, enum: ['Mobile', 'Basic', 'Standard', 'Premium'], required: true },
    
    // Status langganan, bawaannya adalah 'Active' (Aktif)
    status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active' },
    
    // Tanggal mulai langganan, otomatis terisi hari ini (Date.now)
    start_date: { type: Date, default: Date.now },
    
    // Tanggal langganan habis, wajib diisi
    end_date: { type: Date, required: true },
    
    // Metode pembayaran yang dipakai
    payment: { type: String, required: true } 
}, { timestamps: true }); // timestamps: true otomatis membuat kolom tanggal dibuat (createdAt) & diupdate (updatedAt)

module.exports = mongoose2.model('Subscription', SubscriptionSchema);