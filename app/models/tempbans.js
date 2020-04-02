const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const TempBansSchema = new Schema({    
    player_name: {type: String},
    player_guid: {type: String},
    player_steam_id: {type: String},
    player_ip: {type: String},
    player_country_short: {type: String},
    admin_name: {type: String},
    admin_message: {type: String},
    admin_command: {type: String},
    game_server: {type: String},
    admin_id: {type: String},
    admin_steam_id: {type: String, required: true},
    expire: { type: Date}
}, { timestamps: true });

module.exports = mongoose.model('TempBans', TempBansSchema);
