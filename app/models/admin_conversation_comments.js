const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;

const AdminConversationCommentSchema = new Schema({
    sender_id: {type: Schema.Types.ObjectId, ref: 'User'},
    conversation_id: {type: Schema.Types.ObjectId, ref: 'AdminConversation'},
    app_id: {type: Schema.Types.ObjectId, ref: 'Adminapplications'},
    message: {type: String},
}, { timestamps: true });

module.exports = mongoose.model('AdminConversationComment', AdminConversationCommentSchema);

