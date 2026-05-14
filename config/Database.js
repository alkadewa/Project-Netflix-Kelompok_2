const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
require('dotenv').config();

class Database {
    static async connect() {
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log("✅ Terhubung ke MongoDB");
        } catch (error) {
            console.error("❌ Koneksi Gagal:", error.message);
            process.exit(1);
        }
    }
}

module.exports = Database;