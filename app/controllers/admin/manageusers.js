// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const BluebirdPromise = require('bluebird');
const User = require("../../models/user");
const Servers = require("../../models/servers");
const AdminGroups = require("../../models/admingroups");
const AdminConversationComment = require("../../models/admin_conversation");
const Bans = require("../../models/bans");
const Cheaterreports = require("../../models/cheater_reports");
const Globalnotifications = require("../../models/global_notifications");
const Notifications = require("../../models/notifications");
const NotificationsSender = require("../../models/notificationssender");
const Unbans = require("../../models/unbans");
const UserScreenshots = require("../../models/user_screenshots");


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {

	getManageUsers: function(req, res, next) {
	BluebirdPromise.props({
		users: User.find({'local.user_role':{$lte: 1}}, 'local.user_name local.avatar_60').sort({ 'local.user_name': 'asc'}).execAsync(),
		admins: User.find({'local.user_role':{$gte: 2}}, 'local.user_name local.avatar_60').populate('local.admin_on_servers', 'name _id name_alias').sort({'local.user_role': 'desc', 'local.user_name': 'desc'}).execAsync()
	}).then (function(results){
    		res.render('admin/manage-users/index.pug', {title: 'Manage Users', results: results, csrfToken: req.csrfToken()});
  		}).catch(function(err) {
  			console.log(err);
  			res.redirect('/user/profile');
  		});
	},

	ManageUsersByID: function(req, res, next) {
		BluebirdPromise.props({
			user: User.findOne({'_id': req.params.id}).populate('local.admin_on_servers', 'name _id name_alias').execAsync(),
			admingroups: AdminGroups.find({}).sort({'power': 'asc'}).execAsync(),
			servers: Servers.find({}).sort({'name_alias': 'asc'}).execAsync()
		}).then (function(results){
	    	res.render('admin/manage-users/edit.pug', {title: 'Edit User', csrfToken: req.csrfToken(),results: results});
	  	}).catch(function(err) {
	  		console.log(err);
	  		req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
	  		res.redirect('/admin/manage-users');
	  	});
	},

	ManageUsersUpdate: function(req, res, next) {
		User.findOneAsync({'_id' : req.params.id})
		.then (function(result){
			result.local.user_role = req.body.user_role,
			result.local.block_user = req.body.block_user,
			result.saveAsync()
		}).then(function(success) {
			req.flash('success_messages', 'User Power successfully edited');
			res.redirect('back');
		}).catch(function(err) {
			console.log("There was an error: " +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/admin/manage-users');
		});
	},

	ManageUsersUpdateServers: function(req, res, next) {
		User.findOneAsync({'_id' : req.params.id})
		.then (function(result){
			result.local.admin_on_servers = req.body.admin_on_servers,
			result.saveAsync()
			var userID = req.params.id;
			var selected_servers = req.body.admin_on_servers;
			Servers.updateMany({},{$pull:{'admins_on_server':result.id}}, {multi: true},function(error){	
				if (!error){
					if (typeof req.body.admin_on_servers !== 'undefined' && req.body.admin_on_servers){
						//loop trough array req.body.admin_on_servers and add the user to the newly selected servers
						if ( Array.isArray(req.body.admin_on_servers) ) {
							for (var i =0; i < selected_servers.length; i++) {
							    var currentServer = selected_servers[i];
							    Servers.updateOne({'_id':currentServer},{$push:{'admins_on_server':result.id}},function(err){
									if (err){
										console.log(err);
									}
								});
							}
						} else {
							Servers.updateOne({'_id':selected_servers},{$push:{'admins_on_server':result.id}},function(err){
								if (err){
									console.log(err);
								}
							});
						}
					}
				}
			});
		}).then(function(success) {
			req.flash('success_messages', 'Server List successfully edited');
			res.redirect('back');
		}).catch(function(err) {
			console.log("There was an error: " +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/admin/manage-users');
		});
	},

	UserRemove: function(req, res, next) {
		BluebirdPromise.props({
			users: User.findOne({'_id': req.params.id}).execAsync()
		}).then (function(results){
			//Remove from DB everything related to this user
			AdminConversationComment.find({ 'sender_id': req.params.id }).deleteMany().exec();
			Bans.find({ 'cheater_reporter_id': req.params.id }).deleteMany().exec();
			Bans.find({ 'rcon_admin': req.params.id }).deleteMany().exec();
			Cheaterreports.find({ 'sender_id': req.params.id }).deleteMany().exec();
			Globalnotifications.find({ 'sender_id': req.params.id }).deleteMany().exec();
			Globalnotifications.find({ 'recipient_id': req.params.id }).deleteMany().exec();
			Notifications.find({ 'sender_id': req.params.id }).deleteMany().exec();
			Notifications.find({ 'recipient_id': req.params.id }).deleteMany().exec();
			NotificationsSender.find({ 'sender_id': req.params.id }).deleteMany().exec();
			NotificationsSender.find({ 'reciver_id': req.params.id }).deleteMany().exec();
			Unbans.find({ 'rcon_admin': req.params.id }).deleteMany().exec();
			UserScreenshots.find({ 'get_user': req.params.id }).deleteMany().exec();
			//Remove user from arrays
			Servers.updateMany({'admins_on_server':req.params.id},{$pull:{'admins_on_server':req.params.id}},function(err){
				if (err)
					console.log(err);
			});
			Unbans.updateMany({'seen':req.params.id},{$pull:{'seen':req.params.id}},function(err){
				if (err)
					console.log(err);
			});
			Bans.updateMany({'likes':req.params.id},{$pull:{'likes':req.params.id}},function(err){
				if (err)
					console.log(err);
			});
		}).then(function(laststep){
	  		User.findOne({ '_id': req.params.id }).deleteOne().exec();
	  		req.flash('success_messages', 'User successfully deleted');
			res.redirect('/admin/manage-users');
	  	}).catch(function(err) {
	  		console.log(err);
	  		res.redirect('/admin/manage-users');
	  	});
	},
};
