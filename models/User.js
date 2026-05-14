const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    nama: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        // Ini validasi format email
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Format email tidak valid']
    },
    password: { 
        type: String, 
        required: true,
        minlength: [6, 'Password minimal 6 karakter'] // Ini validasi panjang password
    },
    profiles: [{ name: String, isKids: { type: Boolean, default: false } }]
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);