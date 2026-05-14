const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose'); // <--- Tambahkan baris ini

const FilmSchema = new mongoose.Schema({
    judul: { type: String, required: true },
    genre: { type: String, required: true },
    tahun_rilis: { type: Number, required: true },
    duration: { type: Number, required: true },
    isPremium: { type: Boolean, default: false }
});

module.exports = mongoose.model('Film', FilmSchema);