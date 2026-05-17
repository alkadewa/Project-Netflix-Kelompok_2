const dns3 = require('dns');
dns3.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose3 = require('mongoose');

// Membuat "cetakan" data untuk User
const UserSchema = new mongoose3.Schema({
    nama: { type: String, required: true }, // Nama user wajib ada
    email: { 
        type: String, 
        required: true, 
        unique: true, // Email tidak boleh sama dengan orang lain yang sudah daftar
        // Validasi: memastikan yang diketik benar-benar berbentuk email (pakai simbol @ dsb)
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Format email tidak valid']
    },
    password: { 
        type: String, 
        required: true,
        // Validasi: panjang password minimal harus 6 huruf/angka
        minlength: [6, 'Password minimal 6 karakter'] 
    },
    // User bisa punya banyak profil di satu akun (seperti Netflix beneran).
    // isKids: menandakan ini profil anak-anak atau bukan. Bawaannya bukan (false).
    profiles: [{ name: String, isKids: { type: Boolean, default: false } }]
}, { timestamps: true });

module.exports = mongoose3.model('User', UserSchema);