const mongoose = require('mongoose');
const BluebirdPromise = require("bluebird");
BluebirdPromise.promisifyAll(require("mongoose"));
const Schema = mongoose.Schema;
const slug = require('mongoose-slug-generator');

mongoose.plugin(slug);

const ExtraRconSchema = new Schema({
	name: { type: String, unique:true},
    screenshots_enabled: { type: Boolean, default:false},
    minimum_admin_power_for_screenshots:  { type: Number, default:100 },
    screenshots_for_users_enabled: { type: Boolean, default:false},
    maximum_screenshots_for_users: { type: Number, default:100},
    enable_screenshot_all: { type: Boolean, default:false },
    enable_map_change: { type: Boolean, default:false},
    minimum_power_for_map_change: { type: Number, default:100 },
    enable_maprotate: { type: Boolean, default:false},
    minimum_power_for_maprotate:  { type: Number, default:100 },
    enable_player_unban: { type: Boolean, default:false},
    minimum_power_for_player_unban: { type: Number, default:100},
    enable_tempban_duration: { type: Boolean, default:false},
    default_tempban_time: { type: String, default:'20'},
    minimum_cheater_reports: { type: Number, default:5},
    minimum_power_for_cheater_reports: { type: Number, default:80},
}, { timestamps: true });

module.exports = mongoose.model('ExtraRcon', ExtraRconSchema);
