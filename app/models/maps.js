const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const UserMapSchema = new Schema({
    map_name:  { type: String, unique:true},
    display_map_name:  { type: String}
}, { timestamps: true });

module.exports = mongoose.model('UserMap', UserMapSchema);
