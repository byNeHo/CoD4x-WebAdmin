const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const RconpositionSchema = new Schema({
    name:  { type: String, unique: true},
    name_alis:   { type: String, slug: "name" }
}, { timestamps: true });

module.exports = mongoose.model('Rconposition', RconpositionSchema);
