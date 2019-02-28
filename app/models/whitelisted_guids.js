const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const WhitelistedguidsSchema = new Schema({    
    guidlist: [{type: String}]
}, { timestamps: true });
WhitelistedguidsSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Whitelistedguids', WhitelistedguidsSchema);
