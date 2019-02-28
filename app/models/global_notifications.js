const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const GlobalnotificationsSchema = new Schema({
    sender_id: {type: Schema.Types.ObjectId, ref: 'User'},
    recipient_id: {type: Schema.Types.ObjectId, ref: 'User'},
    link_title: { type: String},
    link_text: { type: String},
    link_url: { type: String},
    message: { type: String},
    plus_message: { type: String},
    reported_player: { type: String},
    admin_decision: { type: Number},
    notification_type: { type: String},
    seen: { type: Number, default:0}
}, { timestamps: true });

module.exports = mongoose.model('Globalnotifications', GlobalnotificationsSchema);