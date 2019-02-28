const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const ServerScreenshotsSchema = new Schema({
	player_name:  { type: String},
	player_guid:  { type: String},
	map_name:  { type: String},
	screenshot_img:  { type: String},
	screenshot_img_base64: { data: Buffer, contentType: String },
    get_server: {type: Schema.Types.ObjectId, ref: 'Servers'},
    server_name_alias: { type: String},
}, { timestamps: true });

module.exports = mongoose.model('ServerScreenshots', ServerScreenshotsSchema);
