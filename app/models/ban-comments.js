const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const BancommentsSchema = new Schema({
    user_id: {type: Schema.Types.ObjectId, ref: 'User'},
    bann_id: {type: Schema.Types.ObjectId, ref: 'Bans'},
    user_msg: { type: String}
}, { timestamps: true });

module.exports = mongoose.model('Bancomments', BancommentsSchema);