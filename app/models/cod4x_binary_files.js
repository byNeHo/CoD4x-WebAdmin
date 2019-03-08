const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const Cod4xBinaryFilesSchema = new Schema({
    category: { type: String},
    name: { type: String},
    file_ready: { type: Boolean, default:false},
    status: { type: Boolean, default:false},
}, { timestamps: true });

module.exports = mongoose.model('Cod4xBinaryFiles', Cod4xBinaryFilesSchema);
