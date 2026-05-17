const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
// Memanggil mongoose, alat untuk ngobrol dengan database MongoDB
const mongoose = require('mongoose'); 

// Membuat "cetakan" untuk data Film. Semua film yang masuk ke database harus sesuai aturan ini.
const FilmSchema = new mongoose.Schema({
    judul: { type: String, required: true },        // Teks (String), wajib diisi (required)
    genre: { type: String, required: true },        // Kategori film, wajib diisi
    tahun_rilis: { type: Number, required: true },  // Angka (Number), wajib diisi
    duration: { type: Number, required: true },     // Durasi dalam menit (Angka), wajib diisi
    isPremium: { type: Boolean, default: false }    // Benar/Salah (Boolean). Bawaannya (default) gratis (false)
});

// Membungkus cetakan ini dengan nama 'Film' agar bisa dipakai di file lain
module.exports = mongoose.model('Film', FilmSchema);