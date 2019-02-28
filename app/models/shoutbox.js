const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const ShoutboxSchema = new Schema({
    shout_user_id: {type: Schema.Types.ObjectId, ref: 'User'},
    shout_user_name: { type: String},
    shout_user_avatar: { type: String},
    shout_user_msg: { type: String}
}, { timestamps: true });

module.exports = mongoose.model('Shoutbox', ShoutboxSchema);