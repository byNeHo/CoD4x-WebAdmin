const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const RconconsoleSchema = new Schema({
    rcon_command:  { type: String},
    rcon_response:  { type: String},
    rcon_server: {type: Schema.Types.ObjectId, ref: 'Servers'},
    rcon_user: {type: Schema.Types.ObjectId, ref: 'User'},
}, { timestamps: true });

module.exports = mongoose.model('Rconconsole', RconconsoleSchema);
