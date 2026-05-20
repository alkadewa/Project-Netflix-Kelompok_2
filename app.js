const dns5 = require('dns');
dns5.setServers(['8.8.8.8', '8.8.4.4']);

// Memanggil alat pembuat input teks di terminal
const readline = require('readline/promises');
const dbConfig = require('./config/Database'); 
const appServiceTools = require('./services/AppService');
const UserModel = require('./models/User'); 

// Siapkan layar agar bisa menerima input dari keyboard user
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Fungsi tambahan untuk menggambar garis loading (progress bar) saat nonton film

const drawProgressBar = (current, total) => {
    const size = 20; // Panjang garis progress bar
    const progress = Math.min(size, Math.round((size * current) / total)); // Hitung berapa yang sudah diisi
    // Gambarkan garisnya pake simbol = dan -
    return `[${"=".repeat(progress)}${"-".repeat(size - progress)}] ${Math.round((current / total) * 100)}%`;
};

// OUTPUT 1: PROGRAM UTAMA DIMULAI (HALAMAN AWAL SISTEM)

async function main() {
    await dbConfig.connect(); // Nyalakan koneksi database
    
    // while(true) membuat menu selalu muncul terus menerus kecuali user pilih keluar
    while (true) {
        console.log("\n📺 === NETFLIX CLONE SYSTEM ===");
        console.log("1. Administrasi (Registrasi & Langganan)");
        console.log("2. Masuk ke Aplikasi (Streaming & Profil)");
        console.log("3. Keluar");
        
        // Minta user mengetik pilihan
        const mainChoice = await rl.question("Pilih Menu: ");

        // OUTPUT JIKA USER PILIH MENU ADMIN (MENU 1)

        if (mainChoice === '1') {
            console.log("\n--- MENU ADMIN ---");
            console.log("a. Registrasi User Baru");
            console.log("b. Beli Paket Langganan");
            console.log("c. Lihat Semua Langganan Aktif");
            console.log("d. Kelola/Hapus User");
            console.log("e. Batalkan Langganan User");
            console.log("f. Lihat Statistik Genre (Aggregate)");
            
            const adminMenu = await rl.question("Pilih: ");

            if (adminMenu === 'a') {
                // Input data user baru
                const nama = await rl.question("Nama: ");
                let email = "";
                let password = "";

                // Perulangan nanya terus sampai format emailnya bener
                while (true) {
                    email = await rl.question("Email: ");
                    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // Aturan format email
                    if (emailRegex.test(email)) break; // Kalau bener, keluar dari perulangan
                    else console.log("❌ Format email salah! Contoh: user@mail.com. Silakan ulangi.");
                }

                // Perulangan nanya terus sampai password minimal 6 karakter
                while (true) {
                    password = await rl.question("Password (min 6 karakter): ");
                    if (password.length >= 6) break;
                    else console.log("❌ Password terlalu pendek! Minimal 6 karakter. Silakan ulangi.");
                }

                // Coba simpan ke database
                try {
                    await appServiceTools.tambahUser({ nama, email, password });
                    console.log("\n✅ User berhasil terdaftar!");
                } catch (error) {
                    // Kalau error code 11000, artinya email sudah dipakai orang lain
                    if (error.code === 11000) console.log("❌ Gagal: Email sudah digunakan oleh user lain.");
                    else console.log("❌ Terjadi kesalahan:", error.message);
                }

            } else if (adminMenu === 'b') {
                // Beli Paket Langganan
                const users = await appServiceTools.ambilUsers();
                if (users.length === 0) { console.log("❌ Belum ada user."); continue; }
                
                // Menampilkan daftar user yang mau dibelikan paket
                console.log("\n--- PILIH USER ---");
                users.forEach((u, i) => console.log(`${i+1}. ${u.nama} (${u.email})`));
                const uIdx = parseInt(await rl.question("Pilih User (Nomor): ")) - 1;
                const userDipilih = users[uIdx];
                
                if (!userDipilih) { console.log("❌ User tidak valid."); continue; }

                // Daftar harga paket yang tersedia
                const paketDetails = {
                    "Mobile":   { harga: "Rp 54.000",  fitur: "480p, 1 Perangkat (HP/Tablet)" },
                    "Basic":    { harga: "Rp 120.000", fitur: "720p, 1 Perangkat (Semua Perangkat)" },
                    "Standard": { harga: "Rp 153.000", fitur: "1080p, 2 Perangkat Bersamaan" },
                    "Premium":  { harga: "Rp 186.000", fitur: "4K+HDR, 4 Perangkat Bersamaan" }
                };
                // display package form 
                const pks = ["Mobile", "Basic", "Standard", "Premium"];
                console.log("\n--- PILIHAN PAKET ---");
                pks.forEach((p, i) => {
                    console.log(`${i+1}. ${p} [${paketDetails[p].harga}]`);
                    console.log(`   └─ ${paketDetails[p].fitur}`);
                });

                const pIdx = parseInt(await rl.question("\nPilih Paket (Nomor): ")) - 1;
                const paketDipilih = pks[pIdx];

                if (!paketDipilih) { console.log("❌ Paket tidak valid."); continue; }

                // Pilihan Metode pembayaran
                console.log("\n--- METODE PEMBAYARAN ---");
                const listPayment = ["Bank Transfer", "OVO", "QRIS", "Dana"];
                listPayment.forEach((pay, i) => console.log(`${i+1}. ${pay}`));
                
                const payIdx = parseInt(await rl.question("Pilih Metode (Nomor): ")) - 1;
                const paymentDipilih = listPayment[payIdx];

                try {
                    // Panggil fungsi pembelian dari AppService
                    await appServiceTools.buatSubscription({
                        userId: userDipilih._id,
                        type: paketDipilih,
                        payment: paymentDipilih
                    });
                    console.log(`\n✅ SUKSES! ${userDipilih.nama} berhasil berlangganan paket ${paketDipilih}.`);
                } catch (error) {
                    console.log(`\n❌ GAGAL: ${error.message}`);
                }

            } else if (adminMenu === 'c') {
                // Tampilkan semua user yang berlangganan
                const allSubs = await appServiceTools.ambilSemuaLangganan();
                if (allSubs.length === 0) { console.log("Belum ada langganan aktif."); }
                allSubs.forEach((s, i) => {
                    const namaUser = s.user_id ? s.user_id.nama : "Unknown";
                    console.log(`${i + 1}. [${s.type}] ${namaUser} - Status: ${s.status}`);
                });

            } else if (adminMenu === 'd') {
                // Hapus user
                const users = await appServiceTools.ambilUsers();
                if (users.length === 0) { console.log("❌ Tidak ada user."); continue; }
                
                console.log("\n--- DAFTAR USER ---");
                users.forEach((u, i) => console.log(`${i+1}. ${u.nama} [${u.email}]`));
                const idx = parseInt(await rl.question("Pilih nomor user untuk DIHAPUS: ")) - 1;
                
                if (users[idx]) {
                    const konfirmasi = await rl.question(`Yakin hapus ${users[idx].nama}? (y/n): `);
                    if (konfirmasi.toLowerCase() === 'y') {
                        await appServiceTools.hapusUser(users[idx]._id);
                        console.log("✅ User dan data langganannya telah dihapus.");
                    }
                } else {
                    console.log("❌ Nomor user tidak ditemukan.");
                }

            } else if (adminMenu === 'e') {
                // Batalkan paket aktif
                const email = await rl.question("Masukkan email user untuk pembatalan langganan: ");
                const user = await UserModel.findOne({ email: email });

                if (user) {
                    const sub = await appServiceTools.getSubscriptionInfo(user._id);
                    if (sub) {
                        console.log("\n--- DATA LANGGANAN DITEMUKAN ---");
                        console.log(`Nama User : ${user.nama}`);
                        console.log(`Paket     : ${sub.type}`);
                        console.log(`Sisa Hari : ${sub.daysLeft} Hari`);
                        console.log("--------------------------------");

                        const konfirmasi = await rl.question(`Yakin ingin membatalkan langganan ${user.nama}? (y/n): `);
                        if (konfirmasi.toLowerCase() === 'y') {
                            await appServiceTools.batalkanLangganan(user._id);
                            console.log(`\n✅ Berhasil! Langganan untuk ${user.nama} telah dibatalkan.`);
                        } else {
                            console.log("\n❌ Pembatalan dibatalkan.");
                        }
                    } else {
                        console.log(`\nStatus: User ${user.nama} ditemukan, namun tidak memiliki langganan aktif.`);
                    }
                } else {
                    console.log("\n❌ User dengan email tersebut tidak ditemukan.");
                }

            } else if (adminMenu === 'f') {
                // Lihat data yang dikelompokkan (Aggregate)
                const stats = await appServiceTools.ambilStatistikGenre();
                console.log("\n--- STATISTIK GENRE (HASIL AGGREGATE) ---");
                if (stats.length === 0) {
                    console.log("Belum ada data film.");
                } else {
                    stats.forEach(s => {
                        console.log(`Genre: ${s._id} | Jumlah: ${s.totalFilm} Film`);
                    });
                }
                await rl.question("\nTekan Enter untuk kembali...");
            }

        // OUTPUT JIKA USER PILIH MASUK APLIKASI / LOGIN (MENU 2)
        
        } else if (mainChoice === '2') {
            console.log("\n--- LOGIN USER ---");
            const emailInput = await rl.question("Email   : ");
            const passwordInput = await rl.question("Password: ");

            // Cek keakuratan login
            const currentUser = await appServiceTools.login(emailInput, passwordInput);

            if (!currentUser) {
                console.log("\n❌ LOGIN GAGAL!");
                console.log("Email atau Password salah, atau Anda belum terdaftar.");
                await rl.question("Tekan Enter untuk kembali...");
                continue; // Loncati kode di bawah dan balik ke menu atas
            }

            console.log(`\n✅ Selamat Datang, ${currentUser.nama}!`);
            const currentProfile = currentUser.profiles[0]; // Pakai profil urutan pertama

            if (!currentProfile) {
                console.log("❌ Error: User tidak memiliki profil aktif.");
                await rl.question("Tekan Enter untuk kembali...");
                continue;
            }

            // Kalau login berhasil, masuk ke halaman Dasbor User
            while (true) {
                // Cek status langganannya
                const sub = await appServiceTools.getSubscriptionInfo(currentUser._id);
                console.log(`\n--- Dashboard Profil: ${currentProfile.name} ---`);
                console.log(`Status: ${sub ? `Aktif (${sub.type} - ${sub.daysLeft} hari)` : '🚨 Tidak Berlangganan'}`);

                // Ambil rekomendasi film
                const recs = await appServiceTools.getRecommendation(currentUser._id);
                if (recs.length > 0) {
                    console.log("🌟 REKOMENDASI UNTUKMU:", recs.map(r => r.judul).join(", "));
                }

                console.log("\n1. Katalog Film");
                console.log("2. Update Informasi Akun (Nama/Email/Pass)");
                console.log("3. Keluar ke Menu Utama");
                const menu = await rl.question("Pilih: ");

                if (menu === '1') {
                    // Kalau belum bayar paket, tolak akses ke film!
                    if (!sub) {
                        console.log("\n❌ AKSES DITOLAK!");
                        console.log("Maaf, Anda belum memiliki paket aktif. Silakan ke menu Admin untuk beli langganan.");
                        await rl.question("Tekan Enter untuk kembali...");
                        continue;
                    }

                    // Ambil film kalau sudah bayar paket
                    let films = await appServiceTools.ambilFilms();
                    
                    // Kalau profilnya anak-anak, saring cuma yang rating 'G' (Semua Umur)
                    if (currentProfile.isKids) {
                        films = films.filter(f => f.rating === 'G');
                        console.log("👶 Kids Mode Aktif: Menampilkan film rating G saja.");
                    }

                    console.log("\n--- KATALOG FILM ---");
                    films.forEach((f, i) => {
                        console.log(`${i + 1}. ${f.judul} (${f.genre}) - ${f.tahun_rilis} | ${f.duration} Menit`);
                    });

                    // Input pilih film untuk ditonton
                    const fIdx = parseInt(await rl.question("\nPilih Film (Nomor): ")) - 1;
                    const filmSelected = films[fIdx];

                    // SIMULASI ANIMASI STREAMING DIJALANKAN DI SINI
                    if (filmSelected) {
                        console.clear(); // Bersihkan layar terminal
                        console.log(`\n🎬 Sedang Memutar: ${filmSelected.judul}`);
                        console.log(`Genre: ${filmSelected.genre} | Durasi: ${filmSelected.duration} menit`);
                        
                        let currentMin = 0;
                        const steps = 5;  // Film dibagi jadi 5 tahap lompatan menit biar simulasi cepet
                        const increment = Math.ceil((filmSelected.duration - 0) / steps);

                        for (let i = 0; i <= steps; i++) {
                            process.stdout.write('\x1B[2J\x1B[0f'); // Kode unik terminal untuk me-refresh layar
                            console.log(`\n🎬 Sedang Memutar: ${filmSelected.judul}`);
                            console.log(`\nMenit ke-${currentMin} dari ${filmSelected.duration} menit`);
                            console.log(drawProgressBar(currentMin, filmSelected.duration)); // Tampilkan garis progress
                            
                            await new Promise(res => setTimeout(res, 1500));  // Jeda waktu (delay) 1.5 detik tiap lompatan
                            
                            currentMin += increment; // Tambah menitnya
                            if (currentMin > filmSelected.duration) currentMin = filmSelected.duration; // Mentok di durasi maksimal
                            
                            await appServiceTools.saveProgress(currentUser._id, filmSelected._id, currentMin); // Simpan progress
                        }
                        console.log("\n✅ Selesai menonton! Simulasi pemutaran selesai.");
                        await rl.question("\nTekan Enter untuk kembali...");
                    }

                } else if (menu === '2') {
                    // Fitur edit profil/ganti nama/password
                    console.log("\n--- UPDATE INFORMASI AKUN ---");
                    console.log("(Kosongkan jika tidak ingin mengubah)");
                    
                    const namaBaru = await rl.question(`Nama Baru [${currentUser.nama}]: `);
                    const emailBaru = await rl.question(`Email Baru [${currentUser.email}]: `);
                    const passBaru = await rl.question("Password Baru (min 6 karakter): ");

                    const updateData = {};
                    if (namaBaru) updateData.nama = namaBaru; // Kalau diisi, masukkan data baru
                    if (emailBaru) updateData.email = emailBaru;
                    if (passBaru) updateData.password = passBaru;

                    // Kalau ada data yang diubah, simpan ke database
                    if (Object.keys(updateData).length > 0) {
                        try {
                            const updatedUser = await appServiceTools.updateUserFull(currentUser._id, updateData);
                            // Perbarui data yang lagi login (biar namanya langsung berubah di layar)
                            currentUser.nama = updatedUser.nama;
                            currentUser.email = updatedUser.email;
                            console.log("\n✅ Data berhasil diperbarui!");
                        } catch (error) {
                            if (error.code === 11000) console.log("\n❌ Gagal: Email sudah digunakan oleh orang lain.");
                            else console.log("\n❌ Gagal update: " + error.message);
                        }
                    } else {
                        console.log("\nℹ️ Tidak ada perubahan yang dilakukan.");
                    }
                    await rl.question("Tekan Enter untuk lanjut...");
                } else {
                    break; // Keluar dari Menu Dasbor dan kembali ke Menu Utama
                }
            }
        } else if (mainChoice === '3') {
            console.log("Sampai jumpa!");
            process.exit(0); // Mematikan / Menutup aplikasi
        }
    }
}

// Menjalankan fungsi utama aplikasi dan menangkap error fatal yang membuat aplikasi crash
main().catch(err => console.error("Fatal Error:", err));