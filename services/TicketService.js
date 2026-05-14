const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Ticket = require('../models/Ticket');

class TicketService {
    // CREATE
    async buatPesanan(data) {
        const hargaPerTiket = 50000; // Contoh harga statis
        data.totalHarga = data.jumlahTiket * hargaPerTiket;
        const tiket = new Ticket(data);
        return await tiket.save();
    }

    // READ
    async ambilSemuaPesanan() {
        return await Ticket.find();
    }

    // UPDATE
    async updatePesanan(id, data) {
        if (data.jumlahTiket) {
            data.totalHarga = data.jumlahTiket * 50000;
        }
        return await Ticket.findByIdAndUpdate(id, data, { new: true });
    }

    // DELETE
    async hapusPesanan(id) {
        return await Ticket.findByIdAndDelete(id);
    }
}

module.exports = new TicketService();