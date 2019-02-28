const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const UserScreenshotsSchema = new Schema({
    get_server: {type: Schema.Types.ObjectId, ref: 'Servers'},
    get_user: {type: Schema.Types.ObjectId, ref: 'User'}
}, { timestamps: true });

module.exports = mongoose.model('UserScreenshots', UserScreenshotsSchema);
