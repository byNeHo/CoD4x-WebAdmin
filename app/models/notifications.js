const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const NotificationsSchema = new Schema({
	notification_type: {type: String},
    sender_id: {type: Schema.Types.ObjectId, ref: 'User'},
    recipient_id: {type: Schema.Types.ObjectId, ref: 'User'},
    bann_id: {type: Schema.Types.ObjectId, ref: 'Bans'},
    server_id: {type: Schema.Types.ObjectId, ref: 'Servers'},
    cheater_report_id: {type: Schema.Types.ObjectId, ref: 'Cheaterreports'},
    admin_app_id: {type: Schema.Types.ObjectId, ref: 'Adminapplications'},
    notification_msg: { type: String},
    unban_msg: { type: String},
    admin_app_msg: { type: String},
    seen: { type: Number, default:0}
}, { timestamps: true });

module.exports = mongoose.model('Notifications', NotificationsSchema);