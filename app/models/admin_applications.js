const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const AdminapplicationsSchema = new Schema({
	age:  { type: Number},
	adminappmessage:  { type: String},
	app_sender: {type: Schema.Types.ObjectId, ref: 'User'},
	status:  { type: Boolean, default:false}
}, { timestamps: true });

module.exports = mongoose.model('Adminapplications', AdminapplicationsSchema);
