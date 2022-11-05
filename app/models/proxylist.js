const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const ProxySchema = new Schema({
    adress:  { type: String, unique:true},
    is_vpn: { type: Boolean}
}, { timestamps: true });

module.exports = mongoose.model('Proxy', ProxySchema);
