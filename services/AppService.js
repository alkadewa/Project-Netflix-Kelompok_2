const User = require('../models/User');
const Film = require('../models/Film');
const Subscription = require('../models/Subscription');
const WatchHistory = require('../models/WatchHistory');

class AppService {
    // --- USER & PROFIL ---
    async tambahUser(data) { 
        // Default: Tambah satu profil utama saat register
        data.profiles = [{ name: data.nama, isKids: false }];
        return await new User(data).save(); 
    }
    async ambilUsers() { return await User.find(); }
    // Tambahkan/Pastikan fungsi ini ada di dalam class AppService
    
async updateUserFull(userId, updateData) {
    // runValidators: true memastikan email & password baru tetap dicek formatnya
    return await User.findByIdAndUpdate(
        userId, 
        updateData, 
        { new: true, runValidators: true }
    );
}
    // --- UPDATE & DELETE USER ---
async updateUserInfo(userId, newData) {
    // Mencari berdasarkan ID dan mengupdate data nama/email/password
    return await User.findByIdAndUpdate(userId, newData, { new: true });
}

async hapusUser(userId) {
    // Menghapus User sekaligus menghapus Langganannya agar database bersih
    await Subscription.deleteMany({ user_id: userId });
    return await User.findByIdAndDelete(userId);
}

// --- MANAJEMEN PROFIL (Sub-dokumen) ---
async tambahProfil(userId, profilBaru) {
    return await User.findByIdAndUpdate(
        userId,
        { $push: { profiles: profilBaru } },
        { new: true }
    );
}

async hapusProfil(userId, profileId) {
    return await User.findByIdAndUpdate(
        userId,
        { $pull: { profiles: { _id: profileId } } },
        { new: true }
    );
}

// --- UPDATE SUBSCRIPTION ---
async batalkanLangganan(userId) {
    // Bukan menghapus datanya, tapi mengubah statusnya menjadi 'Cancelled'
    await Subscription.findOneAndUpdate(
  { user_id: userId },
  { status: 'Cancelled' },
  { returnDocument: 'after' } // <--- Gunakan ini sesuai saran warning
);
}

        // --- FILM & REKOMENDASI ---
    async ambilFilms() { return await Film.find(); }
        // Di dalam class AppService
    async login(email, password) {
        // Mencari user berdasarkan email dan password
        const user = await User.findOne({ email: email, password: password });
        return user; 
    }
    async getRecommendation(userId) {
        const history = await WatchHistory.find({ user_id: userId }).populate('film_id');
        if (history.length === 0) return await Film.find().limit(2);

        const genres = history.map(h => h.film_id.genre);
        const favoriteGenre = genres.sort((a, b) =>
            genres.filter(v => v === a).length - genres.filter(v => v === b).length
        ).pop();

        return await Film.find({ genre: favoriteGenre }).limit(2);
    }
    
    // Tambahkan di dalam class AppService
    async ambilSemuaLangganan() {
    // .populate('user_id') digunakan untuk mengambil data user berdasarkan ID yang tersimpan
    return await Subscription.find().populate('user_id');
    }

    // --- SUBSCRIPTION ---
   async buatSubscription(data) {
    // 1. CEK APAKAH USER SUDAH PUNYA LANGGANAN AKTIF
    const existingSub = await Subscription.findOne({ 
        user_id: data.userId, 
        status: 'Active' 
    });

    if (existingSub) {
        // Melempar error agar bisa ditangkap di Main.js
        throw new Error("User ini masih memiliki langganan aktif. Tidak bisa membeli lagi.");
    }

    // 2. JIKA TIDAK ADA, LANJUTKAN PROSES SIMPAN
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 30);

    return await new Subscription({
        user_id: data.userId,
        type: data.type,
        payment: data.payment,
        start_date: start,
        end_date: end,
        status: 'Active'
    }).save();
}

    async getSubscriptionInfo(userId) {
        const sub = await Subscription.findOne({ user_id: userId, status: 'Active', end_date: { $gte: new Date() } });
        if (!sub) return null;
        
        const diffDays = Math.ceil((sub.end_date - new Date()) / (1000 * 60 * 60 * 24));
        return { type: sub.type, daysLeft: diffDays };
    }

    // --- STREAMING PROGRESS ---
    async saveProgress(userId, filmId, minutes) {
        await WatchHistory.findOneAndUpdate(
            { user_id: userId, film_id: filmId },
            { lastMinutes: minutes },
            { upsert: true }
        );
    }
    // --- FUNGSI AGGREGATE SIMPEL ---
async ambilStatistikGenre() {
    return await Film.aggregate([
        {
            // Tahap 1: Kelompokkan film berdasarkan "genre"
            $group: {
                _id: "$genre",           // Kelompokkan data yang genrenya sama
                totalFilm: { $sum: 1 }   // Setiap ada 1 film, tambahkan angka 1 (menghitung jumlah)
            }
        },
        {
            // Tahap 2: Urutkan dari jumlah film terbanyak
            $sort: { totalFilm: -1 }
        }
    ]);
}
}

module.exports = new AppService();