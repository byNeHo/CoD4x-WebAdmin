const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;


const Cod4xversionSchema = new Schema({
	name:  {type: String, default:'CoD4x-Server'},
    prerelease:  { type: Boolean},
    github_version:  { type: String}
}, { timestamps: true });

module.exports = mongoose.model('Cod4xversion', Cod4xversionSchema);
