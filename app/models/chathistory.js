const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const ChathistorySchema = new Schema({    
    pid:  { type: String, unique: true},
    sid:  { type: String},
    messages: [{message: {type: String}, server_name: {type: String}, sent: {type: Date, default: Date.now}}]
}, { timestamps: true });

module.exports = mongoose.model('Chathistory', ChathistorySchema);
