const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const ServerCommandSchema = new Schema({
    command_name: { type: String, unique: true},
    req_power: { type: Number},
    send_back_message_to_server: { type: Boolean, default:false},
}, { timestamps: true });

module.exports = mongoose.model('ServerCommand', ServerCommandSchema);
