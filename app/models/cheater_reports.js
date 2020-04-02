const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const CheaterreportsSchema = new Schema({
	player_name:  { type: String},
	player_name_alias:  { type: String, slug: "player_name"},
	player_guid:  { type: String},
	player_screenshot: { type: String},
	default_message:  { type: String},
	sender_id: {type: Schema.Types.ObjectId, ref: 'User'},
	rcon_server: {type: Schema.Types.ObjectId, ref: 'Servers'},
	report_status:  { type: Boolean, default:false}
}, { timestamps: true });
module.exports = mongoose.model('Cheaterreports', CheaterreportsSchema);
