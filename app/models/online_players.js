const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const OnlinePlayersSchema = new Schema({
    server_alias : {type: String},
    player_slot:  { type: String},
    player_name: { type: String},
    player_score:  { type: Number, defsult: 0},
    player_guid:  { type: String},
    player_steam_id:  { type: String},
    player_kills:  { type: Number, default: 0},
    player_deaths:  { type: Number, default: 0},
    player_assists:  { type: Number, default: 0},
}, { timestamps: true });

module.exports = mongoose.model('OnlinePlayers', OnlinePlayersSchema);
