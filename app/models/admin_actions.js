const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const AdminactionsSchema = new Schema({
	player_name:  { type: String},
	player_guid:  { type: String},
	admin_message: {type: String},
    rcon_command: {type: Schema.Types.ObjectId, ref: 'Rconcommand'},
    rcon_server: {type: Schema.Types.ObjectId, ref: 'Servers'},
    rcon_admin: {type: Schema.Types.ObjectId, ref: 'User'},
    show_action: {type: Number, default:0},
    scheenshot_url: {type: String},
}, { timestamps: true });

module.exports = mongoose.model('Adminactions', AdminactionsSchema);
