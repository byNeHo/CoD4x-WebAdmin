const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const ServersSchema = new Schema({ 
    name:  { type: String, unique: true},
    slug_name:  { type: String, unique: true},
    name_alias: { type: String, slug: "slug_name" },
    ip:  { type: String},
    port: { type: Number},
    online_players:  { type: String},
    max_players:  { type: Number},
    private_clients:  { type: Number, default:0},
    map_playing:  { type: String},
    map_started:  { type: String},
    shortversion:  { type: String},
    map_img:  { type: String},
    country:  { type: String},
    country_shortcode: { type: String},
    game_name:  { type: String},
    rcon_password:  { type: String},
    screenshot_identkey: { type: String},
    julia_identkey: { type: String, unique: true},
    admins_on_server: [{type: Schema.Types.ObjectId, ref: 'User'}],
    color: { type: String, default:'blue'},
    server_rules: { type: String, default:'server rules'},
    external_ip: { type: Boolean},
    is_online: { type: Boolean, default: false},
    script_starter: { type: String},
    server_slots: { type: Number},
    auto_restart_server: { type: Boolean, default: false},
    time_to_restart_server:  { type: Number},
    auto_restart_server_on_crash: { type: Boolean, default: false},
    is_stoped: { type: Boolean},
    player_list: []
}, { timestamps: true });

module.exports = mongoose.model('Servers', ServersSchema);
