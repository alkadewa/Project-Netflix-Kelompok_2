const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const readline = require('readline/promises');
const db = require('./config/Database'); 
const appService = require('./services/AppService');
const User = require('./models/User'); 

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// --- FUNGSI VISUAL ---
const drawProgressBar = (current, total) => {
    const size = 20;
    const progress = Math.min(size, Math.round((size * current) / total));
    return `[${"=".repeat(progress)}${"-".repeat(size - progress)}] ${Math.round((current / total) * 100)}%`;
};

async function startStreaming(film, startFrom, userId) {
    console.clear();
    console.log(`\n🎬 Sedang Memutar: ${film.judul}`);
    console.log(`Genre: ${film.genre} | Durasi: ${film.duration} menit`);
    
    let currentMin = startFrom;
    const steps = 5; 
    const increment = Math.ceil((film.duration - startFrom) / steps);

    for (let i = 0; i <= steps; i++) {
        process.stdout.write('\x1B[2J\x1B[0f'); 
        console.log(`\n🎬 Sedang Memutar: ${film.judul}`);
        console.log(`\nMenit ke-${currentMin} dari ${film.duration} menit`);
        console.log(drawProgressBar(currentMin, film.duration));
        
        await new Promise(res => setTimeout(res, 1500)); 
        
        currentMin += increment;
        if (currentMin > film.duration) currentMin = film.duration;
        
        await appService.saveProgress(userId, film._id, currentMin);
    }
    console.log("\n✅ Selesai menonton! Progress Anda telah disimpan.");
    await rl.question("\nTekan Enter untuk kembali...");
}

// --- FUNGSI UTAMA ---
async function main() {
    await db.connect();
    
    while (true) {
        console.log("\n📺 === NETFLIX CLONE SYSTEM ===");
        console.log("1. Administrasi (Registrasi & Langganan)");
        console.log("2. Masuk ke Aplikasi (Streaming & Profil)");
        console.log("3. Keluar");
        
        const mainChoice = await rl.question("Pilih Menu: ");

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
                const nama = await rl.question("Nama: ");
                let email = "";
                let password = "";

                while (true) {
                    email = await rl.question("Email: ");
                    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                    if (emailRegex.test(email)) break;
                    else console.log("❌ Format email salah! Contoh: user@mail.com. Silakan ulangi.");
                }

                while (true) {
                    password = await rl.question("Password (min 6 karakter): ");
                    if (password.length >= 6) break;
                    else console.log("❌ Password terlalu pendek! Minimal 6 karakter. Silakan ulangi.");
                }

                try {
                    await appService.tambahUser({ nama, email, password });
                    console.log("\n✅ User berhasil terdaftar!");
                } catch (error) {
                    if (error.code === 11000) console.log("❌ Gagal: Email sudah digunakan oleh user lain.");
                    else console.log("❌ Terjadi kesalahan:", error.message);
                }

            } else if (adminMenu === 'b') {
                const users = await appService.ambilUsers();
                if (users.length === 0) { console.log("❌ Belum ada user."); continue; }
                
                console.log("\n--- PILIH USER ---");
                users.forEach((u, i) => console.log(`${i+1}. ${u.nama} (${u.email})`));
                const uIdx = parseInt(await rl.question("Pilih User (Nomor): ")) - 1;
                const userDipilih = users[uIdx];
                
                if (!userDipilih) { console.log("❌ User tidak valid."); continue; }

                const paketDetails = {
                    "Mobile":   { harga: "Rp 54.000",  fitur: "480p, 1 Perangkat (HP/Tablet)" },
                    "Basic":    { harga: "Rp 120.000", fitur: "720p, 1 Perangkat (Semua Perangkat)" },
                    "Standard": { harga: "Rp 153.000", fitur: "1080p, 2 Perangkat Bersamaan" },
                    "Premium":  { harga: "Rp 186.000", fitur: "4K+HDR, 4 Perangkat Bersamaan" }
                };

                const pks = ["Mobile", "Basic", "Standard", "Premium"];
                console.log("\n--- PILIHAN PAKET ---");
                pks.forEach((p, i) => {
                    console.log(`${i+1}. ${p} [${paketDetails[p].harga}]`);
                    console.log(`   └─ ${paketDetails[p].fitur}`);
                });

                const pIdx = parseInt(await rl.question("\nPilih Paket (Nomor): ")) - 1;
                const paketDipilih = pks[pIdx];

                if (!paketDipilih) { console.log("❌ Paket tidak valid."); continue; }

                console.log("\n--- METODE PEMBAYARAN ---");
                const listPayment = ["Bank Transfer", "OVO", "QRIS", "Dana"];
                listPayment.forEach((pay, i) => console.log(`${i+1}. ${pay}`));
                
                const payIdx = parseInt(await rl.question("Pilih Metode (Nomor): ")) - 1;
                const paymentDipilih = listPayment[payIdx];

                try {
                    await appService.buatSubscription({
                        userId: userDipilih._id,
                        type: paketDipilih,
                        payment: paymentDipilih
                    });
                    console.log(`\n✅ SUKSES! ${userDipilih.nama} berhasil berlangganan paket ${paketDipilih}.`);
                } catch (error) {
                    console.log(`\n❌ GAGAL: ${error.message}`);
                }

            } else if (adminMenu === 'c') {
                const allSubs = await appService.ambilSemuaLangganan();
                if (allSubs.length === 0) { console.log("Belum ada langganan aktif."); }
                allSubs.forEach((s, i) => {
                    const namaUser = s.user_id ? s.user_id.nama : "Unknown";
                    console.log(`${i + 1}. [${s.type}] ${namaUser} - Status: ${s.status}`);
                });

            } else if (adminMenu === 'd') {
                const users = await appService.ambilUsers();
                if (users.length === 0) { console.log("❌ Tidak ada user."); continue; }
                
                console.log("\n--- DAFTAR USER ---");
                users.forEach((u, i) => console.log(`${i+1}. ${u.nama} [${u.email}]`));
                const idx = parseInt(await rl.question("Pilih nomor user untuk DIHAPUS: ")) - 1;
                
                if (users[idx]) {
                    const konfirmasi = await rl.question(`Yakin hapus ${users[idx].nama}? (y/n): `);
                    if (konfirmasi.toLowerCase() === 'y') {
                        await appService.hapusUser(users[idx]._id);
                        console.log("✅ User dan data langganannya telah dihapus.");
                    }
                } else {
                    console.log("❌ Nomor user tidak ditemukan.");
                }

            } else if (adminMenu === 'e') {
                const email = await rl.question("Masukkan email user untuk pembatalan langganan: ");
                const user = await User.findOne({ email: email });

                if (user) {
                    const sub = await appService.getSubscriptionInfo(user._id);
                    if (sub) {
                        console.log("\n--- DATA LANGGANAN DITEMUKAN ---");
                        console.log(`Nama User : ${user.nama}`);
                        console.log(`Paket     : ${sub.type}`);
                        console.log(`Sisa Hari : ${sub.daysLeft} Hari`);
                        console.log("--------------------------------");

                        const konfirmasi = await rl.question(`Yakin ingin membatalkan langganan ${user.nama}? (y/n): `);
                        if (konfirmasi.toLowerCase() === 'y') {
                            await appService.batalkanLangganan(user._id);
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
                const stats = await appService.ambilStatistikGenre();
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

        } else if (mainChoice === '2') {
            console.log("\n--- LOGIN USER ---");
            const emailInput = await rl.question("Email   : ");
            const passwordInput = await rl.question("Password: ");

            const currentUser = await appService.login(emailInput, passwordInput);

            if (!currentUser) {
                console.log("\n❌ LOGIN GAGAL!");
                console.log("Email atau Password salah, atau Anda belum terdaftar.");
                await rl.question("Tekan Enter untuk kembali...");
                continue;
            }

            console.log(`\n✅ Selamat Datang, ${currentUser.nama}!`);
            const currentProfile = currentUser.profiles[0];

            if (!currentProfile) {
                console.log("❌ Error: User tidak memiliki profil aktif.");
                await rl.question("Tekan Enter untuk kembali...");
                continue;
            }

            while (true) {
                const sub = await appService.getSubscriptionInfo(currentUser._id);
                console.log(`\n--- Dashboard Profil: ${currentProfile.name} ---`);
                console.log(`Status: ${sub ? `Aktif (${sub.type} - ${sub.daysLeft} hari)` : '🚨 Tidak Berlangganan'}`);

                const recs = await appService.getRecommendation(currentUser._id);
                if (recs.length > 0) {
                    console.log("🌟 REKOMENDASI UNTUKMU:", recs.map(r => r.judul).join(", "));
                }

                console.log("\n1. Katalog Film");
                console.log("2. Update Informasi Akun (Nama/Email/Pass)");
                console.log("3. Keluar ke Menu Utama");
                const menu = await rl.question("Pilih: ");

                if (menu === '1') {
                    if (!sub) {
                        console.log("\n❌ AKSES DITOLAK!");
                        console.log("Maaf, Anda belum memiliki paket aktif. Silakan ke menu Admin untuk beli langganan.");
                        await rl.question("Tekan Enter untuk kembali...");
                        continue;
                    }

                    let films = await appService.ambilFilms();
                    if (currentProfile.isKids) {
                        films = films.filter(f => f.rating === 'G');
                        console.log("👶 Kids Mode Aktif: Menampilkan film rating G saja.");
                    }

                    console.log("\n--- KATALOG FILM ---");
                    films.forEach((f, i) => {
                        console.log(`${i + 1}. ${f.judul} (${f.genre}) - ${f.tahun_rilis} | ${f.duration} Menit`);
                    });

                    const fIdx = parseInt(await rl.question("\nPilih Film (Nomor): ")) - 1;
                    const filmSelected = films[fIdx];

                    if (filmSelected) {
                        await startStreaming(filmSelected, 0, currentUser._id);
                    }
                } else if (menu === '2') {
                    console.log("\n--- UPDATE INFORMASI AKUN ---");
                    console.log("(Kosongkan jika tidak ingin mengubah)");
                    
                    const namaBaru = await rl.question(`Nama Baru [${currentUser.nama}]: `);
                    const emailBaru = await rl.question(`Email Baru [${currentUser.email}]: `);
                    const passBaru = await rl.question("Password Baru (min 6 karakter): ");

                    const updateData = {};
                    if (namaBaru) updateData.nama = namaBaru;
                    if (emailBaru) updateData.email = emailBaru;
                    if (passBaru) updateData.password = passBaru;

                    if (Object.keys(updateData).length > 0) {
                        try {
                            const updatedUser = await appService.updateUserFull(currentUser._id, updateData);
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
                    break; 
                }
            }
        } else if (mainChoice === '3') {
            console.log("Sampai jumpa!");
            process.exit(0);
        }
    }
}

main().catch(err => console.error("Fatal Error:", err));