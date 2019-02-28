const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;


const AppversionSchema = new Schema({
	name:  {type: String, default:'CoD4x-WebaAdmin'},
    local_version:  { type: String, default:'v1.0.0'},
    github_version:  { type: String, default:'v1.0.0'},
    local_cod4x_version:  { type: String, default:'v1.0.0'},
    github_cod4x_version:  { type: String, default:'v1.0.0'}
}, { timestamps: true });

module.exports = mongoose.model('Appversion', AppversionSchema);
