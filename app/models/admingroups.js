const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const AdminGroupSchema = new Schema({
    name:  { type: String, unique: true},
    name_alias:   { type: String, slug: "name" },
    power:  { type: Number, unique: true},
}, { timestamps: true });

module.exports = mongoose.model('AdminGroup', AdminGroupSchema);
