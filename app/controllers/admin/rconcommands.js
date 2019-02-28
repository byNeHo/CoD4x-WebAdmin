// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const AdminGroups = require("../../models/admingroups");
const Rconposition = require("../../models/rconcommand_position");
const Rconcommand = require("../../models/rconcommands");
const ExtraRcon = require("../../models/extra_rcon_commands");
const Color = require("../../models/colors");
const BluebirdPromise = require('bluebird');


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {

	getHome: function(req, res, next) {
		BluebirdPromise.props({
			admingroups: AdminGroups.find({}).execAsync(),
			extrarcon: ExtraRcon.findOne({name:'extra_rcon'}).execAsync(),
			rconcommands: Rconcommand.find({}).sort({name_alias: 'asc'}).execAsync()
		}).then (function(results){
    		res.render('admin/rcon-commands/index.pug', {title: 'Rcon Commands', results: results, csrfToken: req.csrfToken()});
  		}).catch(function(err) {
  			console.log(err);
  			res.redirect('/user/profile');
  		});
	},

	newRconCommand: function(req, res, next) {
		BluebirdPromise.props({
			admingroups: AdminGroups.find({}).sort({power: 'asc'}).execAsync(),
			colors: Color.find({}).sort({name_alias: 'asc'}).execAsync(),
			positions: Rconposition.find({}).sort({name_alias: 'asc'}).execAsync()
		}).then (function(results){
			res.render('admin/rcon-commands/insert.pug', {title: 'Rcon Command - Add', results:results, csrfToken: req.csrfToken()});
		}).catch(function(err) {
  			console.log(err);
  			res.redirect('/user/profile');
  		});
	},

	InsertNewRconCommand: function(req, res, next) {
			var newRconcommand = new Rconcommand ({
				rcon_command: req.body.rcon_command,
				short_name: req.body.short_name,
				rcon_position: req.body.rcon_position,
				min_power: req.body.min_power,
				color: req.body.color,
				send_back_message_to_server: req.body.send_back_message_to_server
			});
			newRconcommand.saveAsync()
			.then(function(saved) {
				req.flash('success_messages', 'Rcon Command successfully added');
				res.redirect('/admin/rcon-commands');
			}).catch(function(err) {
				console.log("There was an error" +err);
				req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
				res.redirect('/admin/rcon-commands');
			});
	},
	RconCommandByID: function(req, res, next) {
		BluebirdPromise.props({
			rcon_command: Rconcommand.findOne({'_id': req.params.id}).execAsync(),
			admingroups: AdminGroups.find({}).sort({power: 'asc'}).execAsync(),
			colors: Color.find({}).sort({name_alias: 'asc'}).execAsync(),
			positions: Rconposition.find({}).sort({name_alias: 'asc'}).execAsync()
		}).then(function(results) {
    		res.render('admin/rcon-commands/edit.pug', {title: 'Edit Rcon Command', csrfToken: req.csrfToken(), results:results});
  		}).catch(function(err) {
  			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
  			console.log(err);
  			res.redirect('/admin/rcon-commands');
  		});
	},
	RconCommandUpdate: function(req, res, next) {
		Rconcommand.findOneAsync({'_id' : req.params.id})
			.then (function(result){
					result.rcon_command = req.body.rcon_command,
					result.short_name = req.body.short_name,
					result.rcon_position = req.body.rcon_position,
					result.min_power = req.body.min_power,
					result.color = req.body.color,
					result.send_back_message_to_server = req.body.send_back_message_to_server ? true : false,
					result.saveAsync()
			}).then(function(update) {
				req.flash('success_messages', 'Rcon Command successfully edited');
				res.redirect('/admin/rcon-commands');
			}).catch(function(err) {
				req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
				console.log("There was an error: " +err);
				res.redirect('/admin/rcon-commands');
		});
	},
	RconCommandRemove: function(req, res) {
		Rconcommand.findOneAndRemoveAsync({'_id': req.params.id}).then (function(){
			req.flash('success_messages', 'Rcon Command successfully deleted');
			res.redirect('/admin/rcon-commands');
		});
	},

	ExtraRconUpdate: function(req, res, next) {
		ExtraRcon.findOneAsync({'_id' : req.params.id}, {new: true})
		.then (function(result){
			result.screenshots_enabled = req.body.screenshots_enabled ? true : false,
			result.minimum_admin_power_for_screenshots = req.body.minimum_admin_power_for_screenshots,
			result.screenshots_for_users_enabled = req.body.screenshots_for_users_enabled ? true : false,
			result.maximum_screenshots_for_users = req.body.maximum_screenshots_for_users,
			result.enable_screenshot_all = req.body.enable_screenshot_all ? true : false,
			result.enable_map_change = req.body.enable_map_change ? true : false,
			result.minimum_power_for_map_change = req.body.minimum_power_for_map_change,
			result.enable_maprotate = req.body.enable_maprotate ? true : false,
			result.minimum_power_for_maprotate = req.body.minimum_power_for_maprotate,
			result.enable_player_unban = req.body.enable_player_unban ? true : false,
			result.minimum_power_for_player_unban = req.body.minimum_power_for_player_unban,
			result.enable_tempban_duration = req.body.enable_tempban_duration ? true : false,
			result.default_tempban_time = req.body.default_tempban_time,
			result.minimum_power_for_cheater_reports = req.body.minimum_power_for_cheater_reports,
			result.minimum_cheater_reports = req.body.minimum_cheater_reports,
			result.saveAsync()
		}).then(function(success) {
			req.flash('success_messages', 'Extra Rcon Settings successfully edited');
			res.redirect('back');
		}).catch(function(err) {
			console.log("There was an error: " +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('back');
		});
	},


	
};
