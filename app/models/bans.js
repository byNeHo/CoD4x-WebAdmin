const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const BansSchema = new Schema({    
    player_name:  { type: String},
    player_guid:  { type: String, unique: true},
    player_screenshot: { type: String},
    player_steam_id: { type: String},
    player_ip: {type: String},
    player_country_short: {type: String},
    admin_name:  { type: String},
    admin_steam_id:  { type: String, required: true},
    admin_id:  { type: String},
    admin_message:  { type: String},
    rcon_command: { type: String},
    server_name: { type: String},
    rcon_admin: {type: Schema.Types.ObjectId, ref: 'User'},
    cheater_reporter:  { type: String},
    cheater_reporter_id:  {type: String},
    unban_request_denied: { type: Boolean}
}, { timestamps: true });
BansSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Bans', BansSchema);
