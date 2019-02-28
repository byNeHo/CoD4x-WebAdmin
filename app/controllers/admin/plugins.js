// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const Plugins = require("../../models/plugins");
const AdminGroups = require("../../models/admingroups");
const BluebirdPromise = require('bluebird');


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {

	getPlugins: function(req, res, next) {
		BluebirdPromise.props({
			activeplugins: Plugins.find({'status':true}).sort({name: 'asc'}).execAsync(),
			inactiveplugins: Plugins.find({'status':{ $ne: true }}).sort({name: 'asc'}).execAsync(),
			admingroups: AdminGroups.find({}).sort({power: 'asc'}).execAsync()
		}).then (function(results){
	    		res.render('admin/plugins/index.pug', {title: 'Plugins', results: results, csrfToken: req.csrfToken()});
	  		}).catch(function(err) {
	  			console.log(err);
	  			res.redirect('/user/profile');
	  		});
	},
	InsertNewPlugins: function(req, res, next) {
		var newPlugins = new Plugins ({
			name: req.body.name,
			description: req.body.description,
			min_power: req.body.min_power,
			status: req.body.status,
		});
		newPlugins.saveAsync()
		.then(function(saved) {
			req.flash('success_messages', req.body.name+' successfully created');
			res.redirect('/admin/plugins');
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/user/profile');
		});
	},
	PluginsByID: function(req, res, next) {
		BluebirdPromise.props({
			plugins: Plugins.findOne({'_id' : req.params.id}).execAsync(),
			admingroups: AdminGroups.find({}).sort({power: 'asc'}).execAsync()
		}).then (function(results){		    
	    	res.render('admin/plugins/edit.pug', {title: 'Edit Plugin', csrfToken: req.csrfToken(),results: results});
	  	}).catch(function(err) {
	  		console.log(err);
	  		req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
	  		res.redirect('/admin/plugins');
	  	});
	},
	PluginsUpdate: function(req, res, next) {
		Plugins.findOneAsync({'_id' : req.params.id}).then (function(result){
			result.name = result.name,
			result.description = result.description,
			result.instructions = result.instructions,
			result.extra_field = req.body.extra_field,
			result.min_power = req.body.min_power,
			result.cron_job_time_intervals = req.body.cron_job_time_intervals,
			result.status = req.body.status ? true : false,
			result.saveAsync()
		}).then(function(success) {
			req.flash('success_messages', 'Plugin successfully edited');
			res.redirect('/admin/plugins');
		}).catch(function(err) {
			console.log("There was an error: " +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/user/profile');
		});
	},
	PluginsUpdateStatusActivate: function(req, res, next) {
		Plugins.updateOne({'_id' : req.params.id}, {$set: {'status': true }
		}).then(function(success) {
			req.flash('success_messages', 'Plugin Successfully Activated');
			res.redirect('/admin/plugins');
		}).catch(function(err) {
			console.log("There was an error: " +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/user/profile');
		});
	},
	PluginsUpdateStatusDeActivate: function(req, res, next) {
		Plugins.updateOne({'_id' : req.params.id}, {$set: {'status': false }
		}).then(function(success) {
			req.flash('success_messages', 'Plugin Successfully Deactivated');
			res.redirect('/admin/plugins');
		}).catch(function(err) {
			console.log("There was an error: " +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/user/profile');
		});
	},
	PluginsRemove: function(req, res) {
		Plugins.findOneAndRemoveAsync({'_id': req.params.id}).then (function(){
			req.flash('success_messages', 'plugins Stuff successfully deleted');
			res.redirect('/admin/plugins');
		});
	},
};
