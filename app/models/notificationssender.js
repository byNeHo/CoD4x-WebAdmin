const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const NotificationsSenderSchema = new Schema({
	notification_type: {type: String},
    sender_id: {type: Schema.Types.ObjectId, ref: 'User'},
    reciver_id: {type: Schema.Types.ObjectId, ref: 'User'},
    notification_title: { type: String},
    notification_url: { type: String},
    sender_name: { type: String},
    sender_avatar: { type: String},
}, { timestamps: true });

module.exports = mongoose.model('NotificationsSender', NotificationsSenderSchema);