const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const PluginsSchema = new Schema({
    name:  { type: String, unique: true},
    name_alias:  { type: String, slug:'name'},
    category:  { type: String},
    description:   { type: String},
    instructions:   { type: String},
    min_power:   { type: Number, default:1},
    require_cronjob:  { type: Boolean},
    cron_job_time_intervals:   { type: Number},
    steam_community_members: [{type: Schema.Types.ObjectId, ref: 'User'}],
    status:  { type: Boolean, default:false},
    extra_field:   { type: String},
}, { timestamps: true });

module.exports = mongoose.model('Plugins', PluginsSchema);
