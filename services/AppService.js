const User = require('../models/User');
const Film = require('../models/Film');
const Subscription = require('../models/Subscription');

// Membuat class AppService, anggap ini sebagai "Pelayan" yang siap menerima perintah
class AppService {
    
    // --- USER & PROFIL ---
    
    // Perintah untuk mendaftarkan user baru ke database
    async tambahUser(data) { 
        // Otomatis membuatkan profil pertama sesuai dengan nama yang didaftarkan
        data.profiles = [{ name: data.nama, isKids: false }];
        return await new User(data).save(); // Simpan ke database
    }
    
    // Perintah untuk melihat semua user yang ada di database
    async ambilUsers() { return await User.find(); }
    
    // Perintah untuk mengedit semua data user (termasuk validasi ulang)
    async updateUserFull(userId, updateData) {
        return await User.findByIdAndUpdate(
            userId,         // Cari user berdasarkan ID
            updateData,     // Data yang mau diubah
            { returnDocument: 'after', runValidators: true } // Kembalikan data baru, dan cek kembali aturannya
        );
    }

    // Perintah untuk mengubah sedikit data user tanpa cek aturan ketat
    async updateUserInfo(userId, newData) {
        return await User.findByIdAndUpdate(userId, newData, { returnDocument: 'after' });
    }

    // Perintah untuk menghapus user dari database selamanya
    async hapusUser(userId) {
        // Hapus dulu semua riwayat langganannya biar bersih
        await Subscription.deleteMany({ user_id: userId });
        // Baru hapus usernya
        return await User.findByIdAndDelete(userId);
    }

    // --- MANAJEMEN PROFIL ---
    
    // Menambahkan sub-profil baru di dalam akun user (contoh: Profil Istri, Profil Anak)
    async tambahProfil(userId, profilBaru) {
        return await User.findByIdAndUpdate(
            userId,
            { $push: { profiles: profilBaru } }, // $push artinya "masukkan ke dalam daftar list"
            { new: true }
        );
    }

    // Menghapus salah satu sub-profil
    async hapusProfil(userId, profileId) {
        return await User.findByIdAndUpdate(
            userId,
            { $pull: { profiles: { _id: profileId } } }, // $pull artinya "tarik/hapus dari daftar list"
            { new: true }
        );
    }

    // --- UPDATE SUBSCRIPTION ---
    
    // Mengubah status langganan user menjadi "Cancelled" (Batal)
    async batalkanLangganan(userId) {
        await Subscription.findOneAndUpdate(
            { user_id: userId },     // Cari langganan milik user ini
            { status: 'Cancelled' }, // Ubah statusnya
            { returnDocument: 'after' }
        );
    }

    // --- FILM & REKOMENDASI ---
    
    // Mengambil semua daftar film dari database
    async ambilFilms() { return await Film.find(); }
    
    // Mengecek apakah email dan password cocok (untuk Login)
    async login(email, password) {
        // Cari 1 data yang email dan password-nya sama persis dengan yang diketik
        return await User.findOne({ email: email, password: password }); 
    }

    // Menampilkan 2 film acak sebagai rekomendasi
    async getRecommendation(userId) {
        return await Film.find().limit(2); // Ambil data film, batasi cuma 2 saja
    }
    
    // Melihat semua orang yang sedang/pernah berlangganan
    async ambilSemuaLangganan() {
        // populate() fungsinya mengambil data lengkap user pembelinya, bukan cuma ID-nya saja
        return await Subscription.find().populate('user_id');
    }

    // --- SUBSCRIPTION ---
    
    // Membuat langganan baru untuk user
    async buatSubscription(data) {
        // Cek dulu, jangan-jangan user ini masih punya langganan yang aktif
        const existingSub = await Subscription.findOne({ 
            user_id: data.userId, 
            status: 'Active' 
        });

        if (existingSub) {
            throw new Error("User ini masih memiliki langganan aktif. Tidak bisa membeli lagi."); // Tolak kalau masih aktif
        }

        // Hitung masa aktif (Beli hari ini, expired 30 hari lagi)
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 30); 

        // Simpan data langganan ke database
        return await new Subscription({
            user_id: data.userId,
            type: data.type,
            payment: data.payment,
            start_date: start,
            end_date: end,
            status: 'Active'
        }).save();
    }

    // Mengambil info langganan user yang sedang login
    async getSubscriptionInfo(userId) {
        // Cari langganan yang aktif dan belum kadaluarsa
        const sub = await Subscription.findOne({ user_id: userId, status: 'Active', end_date: { $gte: new Date() } });
        if (!sub) return null; // Kalau nggak punya, kembalikan kosong (null)
        
        // Hitung sisa harinya pake rumus matematika waktu (milliseconds -> days)
        const diffDays = Math.ceil((sub.end_date - new Date()) / (1000 * 60 * 60 * 24));
        return { type: sub.type, daysLeft: diffDays }; // Kasih tau tipe paket dan sisa hari
    }

    // Menyimpan riwayat nonton (Dikosongkan sesuai permintaan modifikasi agar tak error)
    async saveProgress(userId, filmId, minutes) {
        return; // Tidak melakukan apa-apa
    }

    // --- FUNGSI AGGREGATE SIMPEL ---
    
    // Menghitung statistik (contoh: Genre Action ada 10 film, Drama ada 5 film, dll)
    async ambilStatistikGenre() {
        return await Film.aggregate([
            {
                // Kelompokkan data berdasarkan genre, lalu hitung jumlahnya (+1 tiap ketemu)
                $group: {
                    _id: "$genre", 
                    totalFilm: { $sum: 1 } 
                }
            },
            {
                // Urutkan dari yang jumlah filmnya paling banyak ke paling sedikit (-1)
                $sort: { totalFilm: -1 }
            }
        ]);
    }
}

// Mengekspor semua "pelayanan" ini agar bisa dipanggil oleh menu utama
module.exports = new AppService();