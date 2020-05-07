const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const PlayerstatSchema = new Schema({
    player_name: { type: String, trim: true, default:'cid_0'},
    player_guid: { type: String, unique: true},
    server_id: [{type: Schema.Types.ObjectId, ref: 'Servers'}],
    server_alias:  { type: String},
    server_map: {type: String},
    server_map_img: {type: String},
    player_score:  { type: Number, default:0},
    player_kills:  { type: Number, default:0},
    player_deaths:  { type: Number, default:0},
    player_assists:  { type: Number, default:0},
}, { timestamps: true });

PlayerstatSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Playerstat', PlayerstatSchema);
