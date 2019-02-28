const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const SystemlogsSchema = new Schema({
	logline:  { type: String},
	successed:  { type: Boolean, default: true},
}, { timestamps: true });

module.exports = mongoose.model('Systemlogs', SystemlogsSchema);
