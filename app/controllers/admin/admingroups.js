// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const AdminGroups = require("../../models/admingroups");
const BluebirdPromise = require('bluebird');


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {

	getAdminGroups: function(req, res, next) {
	AdminGroups.find({}).sort({category_alias: 'asc'}).execAsync().then (function(results){
    		res.render('admin/admin-groups/index.pug', {title: 'Admin Groups', results: results, csrfToken: req.csrfToken()});
  		}).catch(function(err) {
  			console.log(err);
  			res.redirect('/user/profile');
  		});
	},

	InsertNewAdminGroups: function(req, res, next) {
		var newAdminGroups = new AdminGroups ({
			name: req.body.name,
			power: req.body.power
		});
		newAdminGroups.saveAsync()
		.then(function(saved) {
			req.flash('success_messages', 'Admin Group successfully created');
			res.redirect('/admin/admin-groups');
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/user/profile');
		});
	},

	AdminGroupsByID: function(req, res, next) {
	AdminGroups.findOne({'_id': req.params.id}).execAsync()
		.then (function(results){
    		res.render('admin/admin-groups/edit.pug', {title: 'Edit Admin Groups', csrfToken: req.csrfToken(), results: results});
  		}).catch(function(err) {
  			console.log(err);
  			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
  			res.redirect('/admin/admin-groups');
  		});
	},

	AdminGroupsUpdate: function(req, res, next) {
		AdminGroups.findOneAsync({'_id' : req.params.id}).then (function(result){
			result.name = req.body.name,
			result.power = req.body.power,
			result.saveAsync()
		}).then(function(success) {
			req.flash('success_messages', 'Admin Group successfully edited');
			res.redirect('/admin/admin-groups');
		}).catch(function(err) {
			console.log("There was an error: " +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/user/profile');
		});
	},

	AdminGroupsRemove: function(req, res) {
		AdminGroups.findOneAndRemoveAsync({'_id': req.params.id}).then (function(){
			req.flash('success_messages', 'Admin Group successfully deleted');
			res.redirect('/admin/admin-groups');
		});
	},
};
