const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const WatchHistorySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    film_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Film' },
    lastMinutes: { type: Number, default: 0 }
});
module.exports = mongoose.model('WatchHistory', WatchHistorySchema);