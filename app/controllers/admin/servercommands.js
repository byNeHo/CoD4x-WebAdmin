// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const AdminGroups = require("../../models/admingroups");
const ServerCommands = require("../../models/server_commands");
const ExtraRcon = require("../../models/extra_rcon_commands");
const BluebirdPromise = require('bluebird');


module.exports = {

	getServercommands: function(req, res, next) {
		BluebirdPromise.props({
			server_commands: ServerCommands.find({}).sort({req_power: 'asc', command_name: 'asc'}).execAsync(),
			admingroups: AdminGroups.find({}).sort({power: 'asc'}).execAsync(),
		}).then (function(results){
    		res.render('admin/server-commands/index.pug', {title: 'Server Commands', results: results, csrfToken: req.csrfToken()});
  		}).catch(function(err) {
  			console.log(err);
  			res.redirect('/user/profile');
  		});
	},

	InsertNewServercommand: function(req, res, next) {
			var newServerCommand = new ServerCommands ({
				command_name: req.body.command_name,
				req_power: req.body.req_power,
				send_back_message_to_server: req.body.send_back_message_to_server
			});
			newServerCommand.saveAsync()
		.then(function(saved) {
			req.flash('success_messages', 'Server Command successfully added');
			res.redirect('/admin/server-commands');
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', 'There was an error '+err);
			res.redirect('/admin/server-commands');
		});
	},

	ServercommandByID: function(req, res, next) {
		BluebirdPromise.props({
			server_commands: ServerCommands.findOne({'_id': req.params.id}).execAsync(),
			admingroups: AdminGroups.find({}).sort({power: 'asc'}).execAsync(),
		}).then(function(results) {
    		res.render('admin/server-commands/edit.pug', {title: 'Edit Server Command', csrfToken: req.csrfToken(), results:results});
  		}).catch(function(err) {
  			req.flash('error_messages', 'There was an error: '+err);
  			console.log(err);
  			res.redirect('/admin/server-commands');
  		});
	},

	ServercommandUpdate: function(req, res, next) {
		ServerCommands.findOneAsync({'_id' : req.params.id})
			.then (function(result){
					result.command_name = req.body.command_name,
					result.req_power = req.body.req_power,
					result.send_back_message_to_server = req.body.send_back_message_to_server ? true : false,
					result.saveAsync()
			}).then(function(update) {
				req.flash('success_messages', 'Server Command successfully edited');
				res.redirect('/admin/server-commands');
			}).catch(function(err) {
				req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
				console.log("There was an error: " +err);
				res.redirect('/admin/server-commands');
		});
	},

	ServercommandRemove: function(req, res) {
		ServerCommands.findOneAndRemoveAsync({'_id': req.params.id}).then (function(){
			req.flash('success_messages', 'Server Command successfully deleted');
			res.redirect('/admin/server-commands');
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
	}
};
