// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const TempbanDurations = require("../../models/tempban_duration");
const BluebirdPromise = require('bluebird');


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {

	getTempbanDurations: function(req, res, next) {
	TempbanDurations.find({}).sort({category_alias: 'desc', time_number: 'asc'}).execAsync()
		.then (function(results){
    		res.render('admin/tempban-durations/index.pug', {title: 'Tempban Durations', results: results, csrfToken: req.csrfToken()});
  		}).catch(function(err) {
  			console.log(err);
  			res.redirect('/user/profile');
  		});
	},

	InsertNewTempbanDurations: function(req, res, next) {

			if (req.body.category=='Minute'){
				sl = req.body.time_number+'m';
				ll = 'min';
			} else if (req.body.category=='Hour'){
				sl = req.body.time_number+'h';
				ll = 'hour';
			} else if (req.body.category=='Day'){
				sl = req.body.time_number+'d';
				ll = 'day';
			} else {
				sl = false;
				ll = false;
			}

			if (sl != false){
				var newTempbanDurations = new TempbanDurations ({
					category: req.body.category,
					time_number: req.body.time_number,
					short_label: sl,
					long_label: ll
				});
				newTempbanDurations.saveAsync()
				.then(function(saved) {
				req.flash('success_messages', 'Tempban Duration successfully created');
				res.redirect('/admin/tempban-durations');
				}).catch(function(err) {
					console.log("There was an error" +err);
					req.flash('error_messages', 'There was an error, this tempban duration is already defined');
					res.redirect('/admin/tempban-durations');
				});
			}else{
				req.flash('error_messages', 'There was an error, please use only Minute, Hour, Day Tempban Types');
				res.redirect('/admin/tempban-durations');
			}
	},

	TempbanDurationsByID: function(req, res, next) {
	TempbanDurations.findOne({'_id': req.params.id}).execAsync()
		.then (function(results){
    		res.render('admin/tempban-durations/edit.pug', {title: 'Edit Tempban Duration', csrfToken: req.csrfToken(), results: results});
  		}).catch(function(err) {
  			console.log(err);
  			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
  			res.redirect('/admin/tempban-durations');
  		});
	},

	TempbanDurationsUpdate: function(req, res, next) {
		TempbanDurations.findOneAsync({'_id' : req.params.id})

		.then (function(result){

			if (req.body.category=='Minute'){
				sl = req.body.time_number+'m';
				ll = 'min';
			} else if (req.body.category=='Hour'){
				sl = req.body.time_number+'h';
				ll = 'hour';
			} else if (req.body.category=='Day'){
				sl = req.body.time_number+'d';
				ll = 'day';
			} else {
				sl = false;
				ll = false;
			}

			if (sl != false){
				result.category = req.body.category,
				result.time_number = req.body.time_number,
				result.short_label = sl,
				result.long_label = req.body.long_label,
				result.saveAsync()
			}else{
				req.flash('error_messages', 'There was an error, please use only Minute, Hour, Day Tempban Types');
				res.redirect('/admin/tempban-durations');
			}


		}).then(function(success) {
			req.flash('success_messages', 'Tempban Duration successfully edited');
			res.redirect('/admin/tempban-durations');
		}).catch(function(err) {
			console.log("There was an error: " +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/admin/tempban-durations');
		});
	},

	TempbanDurationsRemove: function(req, res) {
		TempbanDurations.findOneAndRemoveAsync({'_id': req.params.id}).then (function(){
			req.flash('success_messages', 'Tempban Duration successfully deleted');
			res.redirect('/admin/tempban-durations');
		});
	},
};
