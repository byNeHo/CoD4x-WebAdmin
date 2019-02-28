const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const BlacklistedguidsSchema = new Schema({    
    guidlist: [{type: String}]
}, { timestamps: true });
BlacklistedguidsSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Blacklistedguids', BlacklistedguidsSchema);
