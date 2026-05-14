const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Film = require('../models/Film');
const db = require('../config/Database');

async function seedData() {
    try {
        await db.connect();
        await Film.deleteMany({}); 

        const results = [];
        fs.createReadStream('./DATA_NETFLIX.csv')
            .pipe(csv())
            .on('data', (row) => {
                results.push({
                    judul: row.title,
                    genre: row.main_genre,
                    tahun_rilis: parseInt(row.release_year),
                    duration: parseInt(row.duration) || 60,
                    rating: 'G', // Default
                    isPremium: false
                });
            })
            .on('end', async () => {
                if (results.length > 0) {
                    await Film.insertMany(results);
                    console.log(`✅ Berhasil mengimpor ${results.length} film!`);
                }
                process.exit();
            });
    } catch (error) {
        console.error('❌ Gagal Seeding:', error);
        process.exit(1);
    }
}
seedData();