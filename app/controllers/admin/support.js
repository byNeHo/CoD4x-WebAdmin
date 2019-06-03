// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const Support = require("../../models/support");
const BluebirdPromise = require('bluebird');


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {

	getSupport: function(req, res, next) {
	Support.find({}).sort({category_alias: 'asc'}).execAsync()
	.then (function(results){
    		res.render('admin/support/index.pug', {title: 'Support', results: results});
  		}).catch(function(err) {
  			console.log(err);
  			res.redirect('/user/profile');
  		});
	},

	newSupport: function(req, res, next) {
		res.render('admin/support/insert.pug', {title: 'Support - Add', csrfToken: req.csrfToken()});
	},

	InsertNewSupport: function(req, res, next) {
		var newSupport = new Support ({
			category: req.body.category,
			question: req.body.question,
			answer: req.body.answer
		});
		newSupport.saveAsync()
		.then(function(saved) {
			req.flash('success_messages', 'Support successfully created');
			res.redirect('/admin/support');
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/user/profile');
		});
	},

	SupportByID: function(req, res, next) {
	Support.findOne({'_id': req.params.id}).execAsync().then (function(results){
    		res.render('admin/support/edit.pug', {title: 'Edit Support', csrfToken: req.csrfToken(), results: results});
  		}).catch(function(err) {
  			console.log(err);
  			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
  			res.redirect('/admin/support');
  		});
	},

	SupportUpdate: function(req, res, next) {
		Support.findOneAsync({'_id' : req.params.id}).then (function(result){
			result.category = req.body.category,
			result.question = req.body.question,
			result.answer = req.body.answer,
			result.saveAsync()
		}).then(function(success) {
			req.flash('success_messages', 'Support successfully edited');
			res.redirect('/admin/support');
		}).catch(function(err) {
			console.log("There was an error: " +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/user/profile');
		});
	},

	SupportRemove: function(req, res) {
		Support.findOneAndRemoveAsync({'_id': req.params.id}).then (function(){
			req.flash('success_messages', 'Support successfully deleted');
			res.redirect('/admin/support');
		});
	},
};
