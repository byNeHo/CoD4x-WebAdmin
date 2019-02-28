const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const AdminConversationSchema = new Schema({
    sender_id: {type: Schema.Types.ObjectId, ref: 'User'},
    app_id: {type: Schema.Types.ObjectId, ref: 'Adminapplications'},
}, { timestamps: true });

module.exports = mongoose.model('AdminConversation', AdminConversationSchema);

