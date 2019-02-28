// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const Shoutbox = require("../../models/shoutbox");
const BluebirdPromise = require('bluebird');


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {
	ShoutboxRemoveAll: function(req, res) {
		Shoutbox.deleteMany({})
		.then (function(result){
			req.flash('success_messages', 'Shoutbox messages successfully deleted');
			res.redirect('back');
		});
	},
};
