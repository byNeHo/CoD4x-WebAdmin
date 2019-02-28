const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const TempbanDurationsSchema = new Schema({
    category:  { type: String},
    category_alias:  { type: String, slug: "category" },
    time_number:  { type: Number},
    short_label:  { type: String, unique: true},
    long_label:  { type: String}
}, { timestamps: true });

module.exports = mongoose.model('TempbanDurations', TempbanDurationsSchema);
