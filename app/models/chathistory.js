const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const ChathistorySchema = new Schema({    
    pid:  { type: String},
    sid:  { type: String},
    message:  { type: String},
    server_name:  { type: String}
}, { timestamps: true });

module.exports = mongoose.model('Chathistory', ChathistorySchema);