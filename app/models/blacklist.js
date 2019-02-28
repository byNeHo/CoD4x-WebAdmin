const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const BlacklistSchema = new Schema({    
    player_name:  { type: String},
    player_guid:  { type: String},
    admin_message:  { type: String},
    rcon_command:  { type: String},
    rcon_server: { type: String},
    map_name: { type: String},
    rcon_admin:  { type: String, default:'Julia'},
    count_violations: { type: Number, default: 0},
}, { timestamps: true });
BlacklistSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Blacklist', BlacklistSchema);
