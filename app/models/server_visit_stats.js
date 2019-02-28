const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const ServerVisitsSchema = new Schema({
    server: {type: Schema.Types.ObjectId, ref: 'Servers'},
    online_players: { type: Number},
    playing_map:  { type: String}
}, { timestamps: true });

module.exports = mongoose.model('ServerVisits', ServerVisitsSchema);
