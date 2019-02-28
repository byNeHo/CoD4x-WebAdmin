const flash    = require('connect-flash');
const validator = require('express-validator');
const morgan       = require('morgan');
const session      = require('express-session');
const formatNum = require('format-num');
const async = require("async");
const BluebirdPromise = require('bluebird');
const i18next = require('i18next');
const User = require("../models/user");
const Notifications = require('../models/notifications');
const ExtraRcon = require("../models/extra_rcon_commands");
const Globalnotifications = require("../models/global_notifications");

module.exports =function(app) {
	app.use(function(req, res, next){
		var now = new Date();
		var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		if(req.isAuthenticated()) {
			var populateuser = [{path:'sender_id', select:'local.user_name local.avatar_60 _id'}];
			BluebirdPromise.props({
				globalnotifications: Globalnotifications.find({'recipient_id': req.user._id, 'seen':0}).sort({ 'createdAt': -1}).populate(populateuser).execAsync(),
				notifications: Notifications.find({'seen':0, $or:[ {'notification_type':'unban-request'}, {'notification_type':'admin-app'} ]}).sort({ 'createdAt': -1}).populate(populateuser).execAsync(),
				cheater_reports: Notifications.find({'seen':0, $or:[ {'notification_type':'cheater-reports'}]}).sort({ 'createdAt': -1}).populate(populateuser).execAsync(),
				requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
			}).then (function(results){
				res.locals.admin_notifications = results.notifications;
				res.locals.cheater_reports = results.cheater_reports;
				res.locals.requiredpower = results.requiredpower;
				res.locals.globalnotifications = results.globalnotifications;
				next();
			}).catch (function(err){
				console.log(err);
				next();
			});
		}else{
			var populateuser = [{path:'sender_id', select:'local.user_name local.avatar_60 _id'}];
			BluebirdPromise.props({
				notifications: Notifications.find({'seen':0, $or:[ {'notification_type':'cheater-reports'}, {'notification_type':'unban-request'}, {'notification_type':'admin-app'} ]}).sort({ 'createdAt': -1}).populate(populateuser).execAsync(),
				requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
			}).then (function(results){
				res.locals.admin_notifications = results.notifications;
				res.locals.requiredpower = results.requiredpower;
				next();
			}).catch (function(err){
				console.log(err);
				next();
			});
		}
	});
};