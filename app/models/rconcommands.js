const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const RconcommandSchema = new Schema({
    rcon_command: { type: String, unique: true},
    short_name: { type: String},
    rcon_position: { type: String},
    rcon_position_alias:  { type: String, slug: "rcon_position" },
    min_power: { type: Number},
    color: { type: String},
    send_back_message_to_server: { type: Boolean}
}, { timestamps: true });

module.exports = mongoose.model('Rconcommand', RconcommandSchema);
