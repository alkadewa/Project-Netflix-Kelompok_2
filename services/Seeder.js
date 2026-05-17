const fs = require('fs');         // Alat pembaca file di komputer
const csv = require('csv-parser'); // Alat penerjemah data CSV
const mongoose4 = require('mongoose');
const FilmModel = require('../models/Film'); // Panggil cetakan Film
const db = require('../config/Database');    // Panggil alat koneksi database

// Fungsi utama yang menjalankan tugas memasukkan data massal
async function seedData() {
    try {
        await db.connect(); // Sambungkan ke database
        await FilmModel.deleteMany({}); // HAPUS SEMUA film lama sebelum memasukkan yang baru

        const results = []; // Siapkan keranjang kosong untuk menampung film

        // Baca file CSV bernama 'DATA_NETFLIX.csv'
        fs.createReadStream('./DATA_NETFLIX.csv')
            .pipe(csv()) // Terjemahkan isinya
            .on('data', (row) => {
                // Tiap baris file dibaca, masukkan ke keranjang dengan format berikut:
                results.push({
                    judul: row.title,
                    genre: row.main_genre,
                    tahun_rilis: parseInt(row.release_year),
                    duration: parseInt(row.duration) || 60, // Kalau durasi kosong di file, anggap saja 60 menit
                    rating: 'G', 
                    isPremium: false
                });
            })
            .on('end', async () => {
                // Kalau sudah selesai baca sampai baris paling bawah
                if (results.length > 0) {
                    await FilmModel.insertMany(results); // Simpan semua isi keranjang ke database sekaligus!
                    console.log(`✅ Berhasil mengimpor ${results.length} film!`);
                }
                process.exit(); // Matikan program seeder karena tugas sudah selesai
            });
    } catch (error) {
        console.error('❌ Gagal Seeding:', error); // Tampilkan pesan kalau error
        process.exit(1);
    }
}
seedData(); // Jalankan fungsi ini