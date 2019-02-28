const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const ColorSchema = new Schema({
    name:  { type: String, unique:true}
}, { timestamps: true });

module.exports = mongoose.model('Color', ColorSchema);
